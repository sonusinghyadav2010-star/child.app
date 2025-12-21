
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateKeyPair, exportKey, signPayload, importKey, verifySignature } from './cryptoService';

admin.initializeApp();

const db = admin.firestore();

// Securely store and retrieve keys from Firestore (for demonstration)
// In production, use a secure secret manager.
const KEYS_COLLECTION = 'signingKeys';

// Generates and stores a new key pair, should be called once for setup
export const generateAndStoreKeyPair = functions.https.onCall(async (data, context) => {
  // Add authentication to ensure only authorized users can call this
  // if (!context.auth || !isAdmin(context.auth.uid)) { 
  //   throw new functions.https.HttpsError('permission-denied', 'Must be an admin to call this function.');
  // }'''

  const { publicKey, privateKey } = await generateKeyPair();

  const publicKeyJwk = await exportKey(publicKey);
  const privateKeyJwk = await exportKey(privateKey);

  const keyPairRef = db.collection(KEYS_COLLECTION).doc('defaultPair');

  await keyPairRef.set({
    publicKey: publicKeyJwk,
    privateKey: privateKeyJwk, // Storing private key in Firestore is NOT recommended for production
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { status: 'success', message: 'Key pair generated and stored.' };
});

// Function to retrieve the public key
export const getPublicKey = functions.https.onCall(async (data, context) => {
  const keyPairRef = await db.collection(KEYS_COLLECTION).doc('defaultPair').get();
  if (!keyPairRef.exists) {
    throw new functions.https.HttpsError('not-found', 'Signing keys have not been generated yet.');
  }
  return keyPairRef.data()?.publicKey;
});


export const generatePairingRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
  }

  const parentUid = context.auth.uid;
  const { planId, deviceLimit } = data;

  if (!planId || typeof deviceLimit === 'undefined') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing planId or deviceLimit.');
  }

  const nonce = db.collection('pairingRequests').doc().id;
  const timestamp = Date.now();

  const pairingData = { parentUid, timestamp, nonce, planId, deviceLimit };

  // Retrieve private key and sign the data
  const keyPairDoc = await db.collection(KEYS_COLLECTION).doc('defaultPair').get();
  if (!keyPairDoc.exists) {
    throw new functions.https.HttpsError('failed-precondition', 'Signing keys not found.');
  }
  const privateKeyJwk = keyPairDoc.data()?.privateKey;
  const privateKey = await importKey(privateKeyJwk, 'ES256');
  const signature = await signPayload(privateKey, pairingData);

  const qrData = { ...pairingData, signature };

  await db.collection('pairingRequests').doc(nonce).set({
    ...pairingData,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return qrData;
});


export const linkChildDevice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
  }

  const childUid = context.auth.uid;
  const { qrData, deviceInfo } = data;
  const { parentUid, timestamp, nonce, planId, deviceLimit, signature } = qrData;

  if (!parentUid || !timestamp || !nonce || !planId || typeof deviceLimit === 'undefined' || !signature) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required QR data fields.');
  }

  if (!deviceInfo) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing deviceInfo.');
  }

  // 1. Validate Nonce and Pairing Request
  const pairingRef = db.collection('pairingRequests').doc(nonce);
  const pairingDoc = await pairingRef.get();
  if (!pairingDoc.exists || pairingDoc.data()?.status !== 'pending') {
    throw new functions.https.HttpsError('not-found', 'Pairing request not found or has expired.');
  }

  // 2. Verify Signature
  const keyPairDoc = await db.collection(KEYS_COLLECTION).doc('defaultPair').get();
  if (!keyPairDoc.exists) {
    throw new functions.https.HttpsError('failed-precondition', 'Signing keys not found.');
  }
  const publicKeyJwk = keyPairDoc.data()?.publicKey;
  const publicKey = await importKey(publicKeyJwk, 'ES256');

  const payloadToVerify = { parentUid, timestamp, nonce, planId, deviceLimit };

  const verifiedPayload = await verifySignature(publicKey, signature, payloadToVerify);

  if (!verifiedPayload) {
    throw new functions.https.HttpsError('unauthenticated', 'Invalid signature.');
  }
  
  // 3. Enforce Device Limit
  const childrenCollectionRef = db.collection('users').doc(parentUid).collection('children');
  const existingChildrenSnapshot = await childrenCollectionRef.get();
  if (existingChildrenSnapshot.size >= deviceLimit) {
    throw new functions.https.HttpsError('resource-exhausted', 'Device limit reached.');
  }

  // 4. Link Device
  const batch = db.batch();
  const parentChildRef = childrenCollectionRef.doc(childUid);

  const location = deviceInfo.location ? new admin.firestore.GeoPoint(deviceInfo.location.latitude, deviceInfo.location.longitude) : null;

  batch.set(parentChildRef, {
    childUid, 
    pairedAt: admin.firestore.FieldValue.serverTimestamp(), 
    planId,
    deviceInfo: {
        ...deviceInfo,
        lastKnownLocation: location,
        status: 'WORKING'
    }
  });

  const childMetaRef = db.collection('children').doc(childUid);
  batch.set(childMetaRef, { parentUid, pairedAt: admin.firestore.FieldValue.serverTimestamp(), planId });

  batch.update(pairingRef, { status: 'linked', linkedChildUid: childUid, linkedAt: admin.firestore.FieldValue.serverTimestamp() });

  await batch.commit();

  return { status: 'success', message: 'Device successfully linked.' };
});


export const updateDeviceStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
    }

    const childUid = context.auth.uid;
    const { updatedDetails } = data;

    if (!updatedDetails) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing updatedDetails.');
    }

    // First, find the parent UID from the 'children' collection
    const childMetaRef = db.collection('children').doc(childUid);
    const childMetaDoc = await childMetaRef.get();

    if (!childMetaDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Child device metadata not found.');
    }
    const parentUid = childMetaDoc.data()?.parentUid;
    if (!parentUid) {
        throw new functions.https.HttpsError('failed-precondition', 'Parent UID not found for this child.');
    }

    const childDeviceRef = db.collection('users').doc(parentUid).collection('children').doc(childUid);

    // Use dot notation to update nested fields in deviceInfo
    const updatePayload: { [key: string]: any } = {};
    for (const key in updatedDetails) {
        if (Object.prototype.hasOwnProperty.call(updatedDetails, key)) {
             if (key === 'location' && updatedDetails.location) {
                updatePayload['deviceInfo.lastKnownLocation'] = new admin.firestore.GeoPoint(updatedDetails.location.latitude, updatedDetails.location.longitude);
            } else {
                updatePayload[`deviceInfo.${key}`] = updatedDetails[key];
            }
        }
    }
    
    // Always update lastSync and onlineStatus
    updatePayload['deviceInfo.lastSync'] = new Date().toISOString();
    updatePayload['deviceInfo.onlineStatus'] = 'online';

    await childDeviceRef.update(updatePayload);

    return { status: 'success', message: 'Device status updated.' };
});

export const addGeofence = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
  }

  const parentUid = context.auth.uid;
  const { name, latitude, longitude, radius } = data;

  if (!name || !latitude || !longitude || !radius) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required geofence data.');
  }

  const center = new admin.firestore.GeoPoint(latitude, longitude);

  const geofenceRef = db.collection('users').doc(parentUid).collection('geofences');

  await geofenceRef.add({
    name,
    center,
    radius,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { status: 'success', message: 'Geofence added successfully.' };
});

export const getGeofences = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
    }

    const parentUid = context.auth.uid;
    const geofencesRef = db.collection('users').doc(parentUid).collection('geofences');
    const snapshot = await geofencesRef.get();

    const geofences = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return geofences;
});

export const updateGeofence = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
    }

    const parentUid = context.auth.uid;
    const { geofenceId, ...updateData } = data;

    if (!geofenceId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing geofenceId.');
    }

     if (updateData.latitude && updateData.longitude) {
        updateData.center = new admin.firestore.GeoPoint(updateData.latitude, updateData.longitude);
        delete updateData.latitude;
        delete updateData.longitude;
    }

    const geofenceRef = db.collection('users').doc(parentUid).collection('geofences').doc(geofenceId);

    await geofenceRef.update(updateData);

    return { status: 'success', message: 'Geofence updated successfully.' };
});

export const deleteGeofence = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
    }

    const parentUid = context.auth.uid;
    const { geofenceId } = data;

    if (!geofenceId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing geofenceId.');
    }

    const geofenceRef = db.collection('users').doc(parentUid).collection('geofences').doc(geofenceId);

    await geofenceRef.delete();

    return { status: 'success', message: 'Geofence deleted successfully.' };
});

export const recordAppUsage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
    }

    const childUid = context.auth.uid;
    const { usageStats } = data;

    if (!usageStats || !Array.isArray(usageStats)) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid usageStats.');
    }

    // 1. Find the parent UID
    const childMetaRef = db.collection('children').doc(childUid);
    const childMetaDoc = await childMetaRef.get();

    if (!childMetaDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Child device metadata not found.');
    }
    const parentUid = childMetaDoc.data()?.parentUid;
    if (!parentUid) {
        throw new functions.https.HttpsError('failed-precondition', 'Parent UID not found for this child.');
    }

    // 2. Prepare data for Firestore
    const batch = db.batch();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const appUsageCollectionRef = db.collection('users').doc(parentUid).collection('children').doc(childUid).collection('appUsage');

    const dailyUsageRef = appUsageCollectionRef.doc(today);

    const usageUpdate: { [key: string]: admin.firestore.FieldValue } = {};
    usageStats.forEach(app => {
        if (app.appName && typeof app.timeInForeground === 'number') {
            usageUpdate[app.appName] = admin.firestore.FieldValue.increment(app.timeInForeground);
        }
    });

    if (Object.keys(usageUpdate).length > 0) {
        batch.set(dailyUsageRef, {
            ...usageUpdate,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }


    await batch.commit();

    return { status: 'success', message: 'App usage recorded.' };
});

export const getIntelligentInsights = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
    }

    const parentUid = context.auth.uid;
    const { childUid, timeRange } = data;

    if (!childUid || !timeRange) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing childUid or timeRange.');
    }

    const appUsageRef = db.collection('users').doc(parentUid).collection('children').doc(childUid).collection('appUsage');

    // Default to last 7 days
    let days = 7;
    if (timeRange === 'last30days') {
        days = 30;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (days - 1));

    const dateStrings = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dateStrings.push(d.toISOString().split('T')[0]);
    }

    const usageDocs = await appUsageRef.where(admin.firestore.FieldPath.documentId(), 'in', dateStrings).get();

    let totalScreenTime = 0;
    const allAppUsage: { [key: string]: number } = {};
    const screenTimeByDay: { [key: string]: number } = {};

    usageDocs.forEach(doc => {
        const docData = doc.data();
        let dailyTotal = 0;
        for (const appName in docData) {
            if (appName !== 'lastUpdated') {
                const usage = docData[appName] || 0;
                totalScreenTime += usage;
                dailyTotal += usage;
                allAppUsage[appName] = (allAppUsage[appName] || 0) + usage;
            }
        }
        screenTimeByDay[doc.id] = dailyTotal;
    });

    const topApps = Object.entries(allAppUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([appName, time]) => ({ appName, time }));

    const mostUsedApp = topApps.length > 0 ? topApps[0] : null;
    
    const peakUsage = {
        time: 'Not enough data',
        day: 'Not enough data'
    };


    return {
        totalScreenTime,
        mostUsedApp,
        topApps,
        screenTimeByDay,
        peakUsage
    };
});

export const getPairedChildren = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
    }

    const parentUid = context.auth.uid;

    const childrenRef = db.collection('users').doc(parentUid).collection('children');
    const snapshot = await childrenRef.get();

    const children = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return children;
});

export const sendWebRTCSignal = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
    }

    const { targetUid, signal } = data;

    if (!targetUid || !signal) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing targetUid or signal data.');
    }

    const senderUid = context.auth.uid;

    // Securely store the signal in a way that only the target user can read it.
    // For this example, we'll use a subcollection that both users have access to.
    const signalRef = db.collection('webrtcSignals').doc(targetUid).collection('signals').doc();

    await signalRef.set({
        senderUid,
        signal,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { status: 'success', message: 'Signal sent.' };
});
