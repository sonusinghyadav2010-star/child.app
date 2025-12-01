// src/services/ForegroundServiceManager.ts
import { NativeModules, Platform } from 'react-native';

const { ForegroundServiceModule } = NativeModules;

interface ForegroundServiceManager {
  startForegroundService(): Promise<boolean>;
  stopForegroundService(): Promise<boolean>;
}

const foregroundServiceManager: ForegroundServiceManager = {
  startForegroundService: async () => {
    if (Platform.OS === 'android') {
      try {
        const result = await ForegroundServiceModule.startForegroundService();
        console.log("Foreground service started:", result);
        return result;
      } catch (e: any) {
        console.error("Failed to start foreground service:", e.code, e.message);
        throw e;
      }
    }
    console.log("Foreground service only available on Android.");
    return false;
  },
  stopForegroundService: async () => {
    if (Platform.OS === 'android') {
      try {
        const result = await ForegroundServiceModule.stopForegroundService();
        console.log("Foreground service stopped:", result);
        return result;
      } catch (e: any) {
        console.error("Failed to stop foreground service:", e.code, e.message);
        throw e;
      }
    }
    console.log("Foreground service only available on Android.");
    return false;
  },
};

export default foregroundServiceManager;