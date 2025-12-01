
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// HTTP callable function to generate a signed pairing request for the parent app
// (This would be part of a separate 'parent' Cloud Functions project)
// For this 'child' app context, we'll provide the linking function.
export const generatePairingRequest = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated (a parent user)
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated.');
  }

  const parentUid = context.auth.uid;
  const { planId, deviceLimit } = data;

  if (!planId || typeof deviceLimit === 'undefined') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing planId or deviceLimit.');
  }

  // Generate a nonce to prevent replay attacks and ensure uniqueness
  const nonce = admin.firestore().collection('pairingRequests').doc().id;
  const timestamp = admin.firestore.FieldValue.serverTimestamp(); // Use server timestamp

  const pairingData = {
    parentUid,
    timestamp: Date.now(), // Client-side timestamp for signing, server timestamp for record
    nonce,
    planId,
    deviceLimit,
  };

  // Sign the pairing data using a private key (e.g., from Cloud KMS or a service account key)
  // For demonstration, we'll simulate signing. In production, use a secure signing mechanism.
  // const signer = getSigner(); // This would be a service to get a signing key
  // const signature = await signer.sign(JSON.stringify(pairingData));

  // For this example, we'll just store the data directly without explicit signing here
  // The crucial part is to store it securely and validate on the child app's linking function.
  // In a real scenario, the parent app would request this from *its own* Cloud Function,
  // which would then generate and sign the QR content.

  await admin.firestore().collection('pairingRequests').doc(nonce).set({
    ...pairingData,
    status: 'pending',
    createdAt: timestamp,
  });

  // The parent app would then encode this JSON (including a signature) into a QR code.
  // For this child app context, we assume the QR code contains this info plus a signature.
  return { nonce, parentUid, planId, deviceLimit, timestamp: pairingData.timestamp };
});


// HTTP callable function for the child app to link to a parent
export const linkChildDevice = functions.https.onCall(async (data, context) => {
  // Child app should be authenticated anonymously first, or via some initial auth method
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The request must be authenticated by the child device.');
  }

  const childUid = context.auth.uid;
  const {
    qrData: {
      parentUid,
      timestamp, // Client-side timestamp from QR
      nonce,
      planId,
      deviceLimit,
      signature // This would be the actual signature from the parent app's backend
    },
    childDeviceName // Optional: Name given to the child device by the parent
  } = data;

  if (!parentUid || !timestamp || !nonce || !planId || typeof deviceLimit === 'undefined') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required QR data fields.');
  }

  // 1. Validate Nonce and Pairing Request Existence
  const pairingRef = admin.firestore().collection('pairingRequests').doc(nonce);
  const pairingDoc = await pairingRef.get();

  if (!pairingDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Pairing request not found or expired.');
  }

  const storedPairingData = pairingDoc.data();
  if (storedPairingData?.status !== 'pending' || storedPairingData.parentUid !== parentUid) {
    throw new functions.https.HttpsError('failed-precondition', 'Invalid or already used pairing request.');
  }

  // Implement signature verification here using a public key corresponding to the private key used by the parent app's backend
  // In a real application, 'signature' would be verified against 'parentUid', 'timestamp', 'nonce', 'planId', 'deviceLimit'
  // For this skeleton, we'll skip the actual crypto verification but leave the placeholder.
  // if (!verifySignature(JSON.stringify({ parentUid, timestamp, nonce, planId, deviceLimit }), signature)) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Invalid signature.');
  // }

  // 2. Enforce Device Limit
  const childrenCollectionRef = admin.firestore().collection('users').doc(parentUid).collection('children');
  const existingChildrenSnapshot = await childrenCollectionRef.get();

  if (existingChildrenSnapshot.size >= deviceLimit) {
    throw new functions.https.HttpsError('resource-exhausted', 'Device limit reached for this plan.');
  }

  // 3. Link Device: Write to Firestore
  const batch = admin.firestore().batch();

  // Add child to parent's list of children
  const parentChildRef = childrenCollectionRef.doc(childUid);
  batch.set(parentChildRef, {
    childUid: childUid,
    deviceName: childDeviceName || 'Unknown Device',
    pairedAt: admin.firestore.FieldValue.serverTimestamp(),
    planId: planId,
    // Potentially add more meta-data about the child device
  });

  // Create/update meta-data for the child device itself
  const childMetaRef = admin.firestore().collection('children').doc(childUid);
  batch.set(childMetaRef, {
    parentUid: parentUid,
    pairedAt: admin.firestore.FieldValue.serverTimestamp(),
    planId: planId,
    // Add any other child-specific settings or data
  });

  // Mark the pairing request as used
  batch.update(pairingRef, { status: 'linked', linkedChildUid: childUid, linkedAt: admin.firestore.FieldValue.serverTimestamp() });

  await batch.commit();

  return { status: 'success', message: 'Device successfully linked.' };
});
