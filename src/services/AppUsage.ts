
import { NativeModules } from 'react-native';
import { functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';

const { UsageStatsModule } = NativeModules;

const recordAppUsage = httpsCallable(functions, 'recordAppUsage');

export const getAndSendAppUsage = async () => {
  try {
    const usageStats = await UsageStatsModule.getUsageStats();
    if (usageStats && usageStats.length > 0) {
      await recordAppUsage({ usageStats });
      console.log('App usage stats sent successfully');
    }
  } catch (error) {
    console.error('Error getting or sending app usage stats:', error);
  }
};
