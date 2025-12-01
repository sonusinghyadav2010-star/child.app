// src/permissions/permissionService.ts
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const CONSENT_COLLECTION = 'users';
const CONSENT_SUBCOLLECTION = 'consent';

interface ConsentData {
  [key: string]: { granted: boolean; timestamp: Date; };
}

// Function to update consent timestamp in Firestore
export const updateConsentTimestamp = async (uid: string | undefined | null, permissionType: string, granted: boolean) => {
  if (!uid) {
    console.error("UID is null, cannot record consent.");
    return;
  }
  try {
    const consentDocRef = doc(db, CONSENT_COLLECTION, uid, CONSENT_SUBCOLLECTION, 'permissions');
    await setDoc(consentDocRef, {
      [permissionType]: { granted, timestamp: new Date() },
    }, { merge: true });
    console.log(`Consent for ${permissionType} updated for user ${uid}`);
  } catch (error) {
    console.error(`Error updating consent for ${permissionType}:`, error);
    throw error;
  }
};

// Function to check if consent is recorded in Firestore
export const isConsentGranted = async (uid: string | undefined | null, permissionType: string): Promise<boolean> => {
  if (!uid) {
    console.warn("UID is null, assuming consent not granted.");
    return false;
  }
  try {
    const consentDocRef = doc(db, CONSENT_COLLECTION, uid, CONSENT_SUBCOLLECTION, 'permissions');
    const docSnap = await getDoc(consentDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as ConsentData;
      return data[permissionType]?.granted === true;
    }
    return false;
  } catch (error) {
    console.error(`Error checking consent for ${permissionType}:`, error);
    return false;
  }
};

// Placeholder for checking special permissions that require native modules
// You would replace these with actual native module calls.
export const checkSpecialPermissionNative = async (permissionType: string): Promise<boolean> => {
  // In a real app, integrate with native modules here.
  // Example: if (permissionType === 'SYSTEM_ALERT_WINDOW') return await NativeModules.OverlayPermission.checkStatus();
  // For now, returning false as we cannot check natively.
  console.warn(`Native check for ${permissionType} is a placeholder.`);
  return false;
};

export const requestSpecialPermissionNative = async (permissionType: string): Promise<boolean> => {
  // In a real app, integrate with native modules here.
  // Example: if (permissionType === 'SYSTEM_ALERT_WINDOW') return await NativeModules.OverlayPermission.requestPermission();
  // For now, just logging and showing an alert.
  console.warn(`Native request for ${permissionType} is a placeholder.`);
  Alert.alert("Action Required", `Please manually grant ${permissionType} in settings.`);
  return false;
};