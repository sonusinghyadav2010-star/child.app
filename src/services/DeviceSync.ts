
import { NativeModules } from 'react-native';

const { CallLogModule, SmsModule } = NativeModules;

export const getCallHistory = async () => {
  try {
    const callHistory = await CallLogModule.getCallHistory();
    return callHistory;
  } catch (error) {
    console.error('Error fetching call history:', error);
    return [];
  }
};

export const getSmsHistory = async () => {
  try {
    const smsHistory = await SmsModule.getSmsHistory();
    return smsHistory;
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    return [];
  }
};
