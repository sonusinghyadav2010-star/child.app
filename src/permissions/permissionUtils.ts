// src/permissions/permissionUtils.ts
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { isConsentGranted, updateConsentTimestamp } from './permissionService';
import { auth } from '../firebase/firebaseConfig'; // Assuming auth is exported

interface PermissionStatus {
  status: boolean;
  type: string;
  explanation?: string;
  isSpecialPermission?: boolean;
}

interface PermissionRequestResult {
  granted: boolean;
  message?: string;
}

export const requestPermission = async (permissionType: string, rationale?: string): Promise<PermissionRequestResult> => {
  if (Platform.OS !== 'android') {
    return { granted: true }; // Permissions generally handled differently on other platforms
  }

  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    Alert.alert("Error", "User not authenticated. Cannot record consent.");
    return { granted: false, message: "User not authenticated." };
  }

  let granted = false;
  let message = '';
  let isSpecialPermission = false;

  try {
    switch (permissionType) {
      case 'CAMERA':
        granted = (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)) === PermissionsAndroid.RESULTS.GRANTED;
        break;
      case 'RECORD_AUDIO':
        granted = (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)) === PermissionsAndroid.RESULTS.GRANTED;
        break;
      case 'ACCESS_FINE_LOCATION':
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // For background location, typically another request or a more complex flow is needed
          // On Android 10+, you need requestBackgroundPermissionsAsync()
          const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
          granted = backgroundStatus.status === 'granted';
        } else {
          granted = false;
        }
        break;
      case 'READ_EXTERNAL_STORAGE': // Old, deprecated for newer Android versions for media files
      case 'WRITE_EXTERNAL_STORAGE': // Old, deprecated for newer Android versions for media files
      case 'READ_MEDIA_IMAGES':
      case 'READ_MEDIA_VIDEO':
      case 'READ_MEDIA_AUDIO':
        // On Android 13+, you'd request READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO
        // For simplicity, we'll try to request WRITE_EXTERNAL_STORAGE which often covers older needs,
        // but a more robust solution should check SDK version.
        granted = (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)) === PermissionsAndroid.RESULTS.GRANTED;
        break;
      case 'POST_NOTIFICATIONS': // For Android 13+ (API 33+)
        if (Platform.Version >= 33) {
          const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
          granted = notificationStatus === 'granted';
        } else {
          granted = true; // Not required on older Android versions
        }
        break;
      case 'SYSTEM_ALERT_WINDOW': // Draw Over Other Apps
        isSpecialPermission = true;
        Alert.alert(
          "Permission Required",
          rationale || "This app needs permission to draw over other apps for certain features (e.g., parental controls overlays).",
          [
            { text: "Cancel", onPress: () => {}, style: "cancel" },
            { text: "Go to Settings", onPress: () => Linking.openSettings() }
          ]
        );
        // You would typically use a native module to check and request this specific permission.
        // Example: RN Android Overlay library or custom native code.
        // For now, we'll return false, as direct JS check/request is not straightforward.
        return { granted: false, message: "User needs to grant Draw Over Apps permission manually." };
      case 'BIND_NOTIFICATION_LISTENER_SERVICE': // Notification Listener
        isSpecialPermission = true;
        Alert.alert(
          "Permission Required",
          rationale || "This app needs access to read notifications to provide monitoring features.",
          [
            { text: "Cancel", onPress: () => {}, style: "cancel" },
            { text: "Go to Settings", onPress: () => Linking.openSettings() }
          ]
        );
        // Similar to SYSTEM_ALERT_WINDOW, requires native module to open specific settings page.
        // Example: Intent to "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"
        return { granted: false, message: "User needs to grant Notification Listener permission manually." };
      case 'BIND_ACCESSIBILITY_SERVICE': // Accessibility Service
        isSpecialPermission = true;
        Alert.alert(
          "Permission Required",
          rationale || "This app requires Accessibility Service to monitor and block apps as configured by the parent.",
          [
            { text: "Cancel", onPress: () => {}, style: "cancel" },
            { text: "Go to Settings", onPress: () => Linking.openSettings() }
          ]
        );
        // Requires native module to open Accessibility settings.
        // Example: Intent to "android.settings.ACCESSIBILITY_SETTINGS"
        return { granted: false, message: "User needs to enable Accessibility Service manually." };
      case 'DEVICE_ADMIN': // Device Administrator
        isSpecialPermission = true;
        Alert.alert(
          "Permission Required",
          rationale || "This app requests Device Administrator privileges for features like remote lock/wipe (if enabled by parent).",
          [
            { text: "Cancel", onPress: () => {}, style: "cancel" },
            { text: "Go to Settings", onPress: () => Linking.openSettings() }
          ]
        );
        // Requires native module with a specific Intent for Device Admin activation.
        return { granted: false, message: "User needs to activate Device Admin manually." };
      case 'MEDIA_PROJECTION': // Screen Capture
        isSpecialPermission = true;
        Alert.alert(
          "Permission Required",
          rationale || "This app needs permission to capture the screen for monitoring purposes.",
          [
            { text: "Cancel", onPress: () => {}, style: "cancel" },
            { text: "OK", onPress: () => { /* Native module to request MediaProjection */ Alert.alert("Note", "You will see a system dialog to start screen capture. Please allow it."); } }
          ]
        );
        // This requires initiating a MediaProjection capture via a native module, which shows a system consent dialog.
        return { granted: false, message: "User needs to consent to MediaProjection via system dialog." };
      default:
        console.warn(`Unknown permission type: ${permissionType}`);
        return { granted: false, message: "Unknown permission type." };
    }

    if (granted) {
      await updateConsentTimestamp(currentUserId, permissionType, true);
      return { granted: true };
    } else {
      message = `${permissionType} permission denied.`;
      return { granted: false, message };
    }
  } catch (err: any) {
    console.error(`Error requesting ${permissionType} permission: `, err);
    return { granted: false, message: err.message || `Failed to request ${permissionType} permission.` };
  }
};

export const checkPermissionStatus = async (permissionType: string): Promise<PermissionStatus> => {
  if (Platform.OS !== 'android') {
    return { status: true, type: permissionType };
  }

  let status = false;
  let explanation = '';
  let isSpecialPermission = false;

  try {
    switch (permissionType) {
      case 'CAMERA':
        status = (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA));
        explanation = "Camera access is needed for various monitoring features.";
        break;
      case 'RECORD_AUDIO':
        status = (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO));
        explanation = "Microphone access is needed for audio monitoring.";
        break;
      case 'ACCESS_FINE_LOCATION':
        let fgStatus = await Location.getForegroundPermissionsAsync();
        let bgStatus = await Location.getBackgroundPermissionsAsync();
        status = fgStatus.granted && bgStatus.granted; // Require both for full location
        explanation = "Location access (foreground and background) is needed to track device location.";
        break;
      case 'READ_EXTERNAL_STORAGE':
      case 'WRITE_EXTERNAL_STORAGE':
      case 'READ_MEDIA_IMAGES':
      case 'READ_MEDIA_VIDEO':
      case 'READ_MEDIA_AUDIO':
        status = (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)); // Simplified check
        explanation = "Storage access is needed to store media and other data.";
        break;
      case 'POST_NOTIFICATIONS':
        if (Platform.Version >= 33) {
          const { status: notificationStatus } = await Notifications.getPermissionsAsync();
          status = notificationStatus === 'granted';
        } else {
          status = true; // Not required on older Android versions
        }
        explanation = "Notification permission is needed for foreground service notifications and alerts.";
        break;
      case 'SYSTEM_ALERT_WINDOW': // Draw Over Other Apps
        isSpecialPermission = true;
        // Requires native module to check
        // For demonstration, assume false until explicitly granted via native logic.
        explanation = "Permission to draw over other apps is required for parental controls overlays.";
        status = false; // Placeholder
        break;
      case 'BIND_NOTIFICATION_LISTENER_SERVICE': // Notification Listener
        isSpecialPermission = true;
        // Requires native module to check if the service is enabled.
        explanation = "Notification Listener access is required to monitor device notifications.";
        status = false; // Placeholder
        break;
      case 'BIND_ACCESSIBILITY_SERVICE': // Accessibility Service
        isSpecialPermission = true;
        // Requires native module to check if the service is enabled.
        explanation = "Accessibility Service is required for app blocking and usage monitoring.";
        status = false; // Placeholder
        break;
      case 'DEVICE_ADMIN': // Device Administrator
        isSpecialPermission = true;
        // Requires native module to check if device admin is active.
        explanation = "Device Administrator privileges may be used for remote device management features.";
        status = false; // Placeholder
        break;
      case 'MEDIA_PROJECTION': // Screen Capture
        isSpecialPermission = true;
        // This is usually a transient permission. Check if a session is active via native module.
        explanation = "Screen capture permission is required to monitor screen activity.";
        status = false; // Placeholder
        break;
      default:
        console.warn(`Unknown permission type for status check: ${permissionType}`);
        return { status: false, type: permissionType, explanation: "Unknown permission." };
    }

    const consentRecorded = await isConsentGranted(auth.currentUser?.uid, permissionType);
    return { status: status && consentRecorded, type: permissionType, explanation, isSpecialPermission };

  } catch (err: any) {
    console.error(`Error checking ${permissionType} permission status: `, err);
    return { status: false, type: permissionType, explanation: err.message || `Failed to check ${permissionType} permission.` };
  }
};

// Helper to open specific app settings for manual permission granting
export const openAppSettings = () => {
  Linking.openSettings();
};

// Add a placeholder for a native module to handle specific permission checks/requests
// For example:
// import NativePermissionManager from './NativePermissionManager';
// NativePermissionManager.checkDrawOverlayPermission();
// NativePermissionManager.requestAccessibilityService();