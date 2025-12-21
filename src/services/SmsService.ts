
import { NativeModules } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const { SmsModule } = NativeModules;

interface Sms {
  address: string;
  date: string;
  type: 'inbox' | 'sent' | 'unknown';
}

/**
 * Fetches the SMS history from the native module.
 * @returns {Promise<Sms[]>} A promise that resolves with the SMS history.
 */
const getSmsHistory = async (): Promise<Sms[]> => {
  try {
    // The native module now only returns metadata
    const smsHistory: Sms[] = await SmsModule.getSmsHistory();
    return smsHistory;
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    return [];
  }
};

/**
 * Syncs the device's SMS history (metadata only) with the Firestore database.
 * @param {string} childUid - The UID of the child device.
 */
const syncSmsHistory = async (childUid: string) => {
  if (!childUid) {
    console.error('Child UID is required to sync SMS history.');
    return;
  }

  try {
    const smsList = await getSmsHistory();
    if (smsList.length === 0) {
      console.log('No SMS history to sync.');
      return;
    }

    const batch = firestore().batch();
    const collectionRef = firestore().collection('devices').doc(childUid).collection('sms');

    smsList.forEach(sms => {
      // Use a combination of date and address to create a unique-enough ID
      const docId = `${sms.date.replace(/[^0-9]/g, '')}_${sms.address}`;
      const docRef = collectionRef.doc(docId);
      // The 'sms' object no longer contains the body, only metadata.
      batch.set(docRef, sms);
    });

    await batch.commit();
    console.log(`Successfully synced ${smsList.length} SMS messages (metadata only).`);
  } catch (error) {
    console.error('Error syncing SMS history to Firestore:', error);
  }
};

export default {
  getSmsHistory,
  syncSmsHistory,
};
