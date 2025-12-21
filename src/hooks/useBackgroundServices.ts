
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getAndSendAppUsage } from '../services/AppUsage';
import { startLocationTracking, stopLocationTracking } from '../services/Location';
import CommandListener from '../services/CommandListener';
import RTCService from '../services/RTCService';
import SmsService from '../services/SmsService';
import CallLogService from '../services/CallLogService'; // Import the new CallLogService

const useBackgroundServices = (permissionsSetupComplete: boolean | null, childUid: string, parentUid: string) => {
  useEffect(() => {
    let appUsageInterval: NodeJS.Timeout | null = null;
    let commandListener: CommandListener | null = null;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        if (permissionsSetupComplete) {
          getAndSendAppUsage();
        }
      }
    };

    if (permissionsSetupComplete) {
      // Start location tracking
      startLocationTracking();

      // Initial data syncs
      getAndSendAppUsage();
      SmsService.syncSmsHistory(childUid);
      CallLogService.syncCallLogHistory(childUid); // Sync call log history on startup

      // Setup command listener for real-time commands
      const rtcService = new RTCService(() => {}); // onRemoteStream callback is not used in child app
      commandListener = new CommandListener(rtcService);
      commandListener.listenForCommands(childUid, parentUid);

      // Set up periodic sync for app usage
      appUsageInterval = setInterval(() => {
        getAndSendAppUsage();
      }, 1000 * 60 * 60); // Fetch every hour

      AppState.addEventListener('change', handleAppStateChange);
    } else {
      // Stop all services if permissions are not complete
      stopLocationTracking();
      if (appUsageInterval) {
        clearInterval(appUsageInterval);
      }
    }

    return () => {
      // Cleanup on component unmount or when permissions are revoked
      stopLocationTracking();
      if (appUsageInterval) {
        clearInterval(appUsageInterval);
      }
      if (commandListener) {
        commandListener.stopListening();
      }
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [permissionsSetupComplete, childUid, parentUid]);
};

export default useBackgroundServices;
