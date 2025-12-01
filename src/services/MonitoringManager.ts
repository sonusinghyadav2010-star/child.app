import { NativeModules, Platform } from 'react-native';

const { MonitoringModule } = NativeModules;

class MonitoringManager {
  async takePhotoAndUpload(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('Camera photo upload is Android-specific.');
      return false;
    }
    return MonitoringModule.takePhotoAndUpload();
  }

  async switchCamera(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('Camera switch is Android-specific.');
      return false;
    }
    return MonitoringModule.switchCamera();
  }

  async requestUsageStatsPermissionIntent(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('Usage Stats permission is Android-specific.');
      return false;
    }
    return MonitoringModule.requestUsageStatsPermissionIntent();
  }
}

export default new MonitoringManager();