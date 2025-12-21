
import { NativeModules, PermissionsAndroid } from 'react-native';

const { DeviceDetailsModule } = NativeModules;

async function requestLocationPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs access to your location to provide location-based services.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}

export const getDeviceDetails = async () => {
  try {
    const deviceName = await DeviceDetailsModule.getDeviceName();
    const deviceType = await DeviceDetailsModule.getDeviceType();
    const osVersion = await DeviceDetailsModule.getOsVersion();
    const ipAddress = await DeviceDetailsModule.getIpAddress();
    const { batteryLevel, isCharging } = await DeviceDetailsModule.getBatteryDetails();

    let location = null;
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
        try {
            location = await DeviceDetailsModule.getCurrentLocation();
        } catch(e) {
            console.log('Could not get location', e)
        }
    }


    return {
      deviceName,
      deviceType,
      osVersion,
      ipAddress,
      batteryLevel,
      isCharging,
      lastSync: new Date().toISOString(),
      onlineStatus: 'online',
      location
    };
  } catch (error) {
    console.error('Error fetching device details:', error);
    return null;
  }
};
