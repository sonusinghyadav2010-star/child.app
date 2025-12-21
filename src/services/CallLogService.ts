
import { NativeModules } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const { CallLogModule } = NativeModules;

interface CallLog {
  number: string;
  duration: string;
  date: string;
  type: 'incoming' | 'outgoing' | 'missed' | 'voicemail' | 'rejected' | 'blocked' | 'unknown';
}

/**
 * Fetches the call log history from the native module.
 * @returns {Promise<CallLog[]>} A promise that resolves with the call log history.
 */
const getCallLogHistory = async (): Promise<CallLog[]> => {
  try {
    const callLogHistory: CallLog[] = await CallLogModule.getCallLogHistory();
    return callLogHistory;
  } catch (error) {
    console.error('Error fetching call log history:', error);
    return [];
  }
};

/**
 * Syncs the device's call log history with the Firestore database.
 * @param {string} childUid - The UID of the child device.
 */
const syncCallLogHistory = async (childUid: string) => {
  if (!childUid) {
    console.error('Child UID is required to sync call log history.');
    return;
  }

  try {
    const callLogList = await getCallLogHistory();
    if (callLogList.length === 0) {
      console.log('No call log history to sync.');
      return;
    }

    const batch = firestore().batch();
    const collectionRef = firestore().collection('devices').doc(childUid).collection('calllogs');

    callLogList.forEach(log => {
      // Use a combination of date and number to create a unique-enough ID
      const docId = `${log.date.replace(/[^0-9]/g, '')}_${log.number}`;
      const docRef = collectionRef.doc(docId);
      batch.set(docRef, log);
    });

    await batch.commit();
    console.log(`Successfully synced ${callLogList.length} call logs.`);
  } catch (error) {
    console.error('Error syncing call log history to Firestore:', error);
  }
};

export default {
  getCallLogHistory,
  syncCallLogHistory,
};
