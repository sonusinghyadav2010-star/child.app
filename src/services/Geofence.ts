
import { NativeModules } from 'react-native';

const { GeofenceModule } = NativeModules;

export const addGeofences = (geofences: any[]) => {
  try {
    GeofenceModule.addGeofences(geofences);
    console.log('Geofences added successfully');
  } catch (error) {
    console.error('Error adding geofences:', error);
  }
};

export const removeGeofences = async (geofenceIds: string[]) => {
  try {
    const result = await GeofenceModule.removeGeofences(geofenceIds);
    console.log(result);
  } catch (error) {
    console.error('Error removing geofences:', error);
  }
};

export const removeAllGeofences = async () => {
  try {
    const result = await GeofenceModule.removeAllGeofences();
    console.log(result);
  } catch (error) {
    console.error('Error removing all geofences:', error);
  }
};
