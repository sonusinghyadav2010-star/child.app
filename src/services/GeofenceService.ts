import { NativeModules } from 'react-native';

const { GeofenceModule } = NativeModules;

interface Geofence {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
}

/**
 * Adds a new geofence to be monitored.
 * @param {Geofence} geofence - The geofence object.
 * @returns {Promise<string>} A promise that resolves with a success message.
 */
const addGeofence = async (geofence: Geofence): Promise<string> => {
  try {
    const result = await GeofenceModule.addGeofence(
      geofence.id,
      geofence.latitude,
      geofence.longitude,
      geofence.radius
    );
    console.log(`Geofence added: ${geofence.id}`);
    return result;
  } catch (error) {
    console.error(`Error adding geofence ${geofence.id}:`, error);
    throw error;
  }
};

/**
 * Removes a geofence from monitoring.
 * @param {string} geofenceId - The ID of the geofence to remove.
 * @returns {Promise<string>} A promise that resolves with a success message.
 */
const removeGeofence = async (geofenceId: string): Promise<string> => {
  try {
    const result = await GeofenceModule.removeGeofence(geofenceId);
    console.log(`Geofence removed: ${geofenceId}`);
    return result;
  } catch (error) {
    console.error(`Error removing geofence ${geofenceId}:`, error);
    throw error;
  }
};

export default {
  addGeofence,
  removeGeofence,
};
