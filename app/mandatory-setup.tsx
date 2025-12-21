import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, Platform, PermissionsAndroid, ScrollView, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { NativeModules } from 'react-native';

// Mock NativeModules for web to avoid crashing
const { PermissionsModule, WebFilteringModule, DeviceAdminModule } = Platform.OS === 'web'
  ? {
      PermissionsModule: {
        isNotificationListenerEnabled: async () => false,
        requestNotificationListenerPermission: () => {},
        isForegroundServiceEnabled: async () => false,
        requestForegroundServicePermission: () => {},
      },
      WebFilteringModule: {
        isAccessibilityServiceEnabled: async () => false,
        requestAccessibilityPermission: () => {},
      },
      DeviceAdminModule: {
        isDeviceAdminEnabled: async () => false,
        requestDeviceAdminPermission: () => {},
      },
    }
  : NativeModules;

// A reusable list item component
const ListItem = ({ title, status, onFix }) => (
  <View style={styles.listItem}>
    <Text style={styles.listItemText}>{title}</Text>
    <View style={styles.statusContainer}>
      <Text style={[styles.statusText, { color: status ? 'green' : 'red' }]}>
        {status ? 'Enabled' : 'Disabled'}
      </Text>
      {!status && <Button title="Fix" onPress={onFix} />}
    </View>
  </View>
);

export default function MandatorySetupScreen() {
  const router = useRouter();
  const [permissions, setPermissions] = useState({
    isAccessibilityEnabled: false,
    isNotificationListenerEnabled: false,
    hasCallLogPermission: false,
    hasLocationPermission: false,
    isDeviceAdminEnabled: false,
    hasCameraPermission: false,
    hasMicrophonePermission: false,
isForegroundServiceEnabled: false,
  });

  const checkAllPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      const accessibility = await WebFilteringModule.isAccessibilityServiceEnabled();
      const notification = await PermissionsModule.isNotificationListenerEnabled();
      const callLog = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CALL_LOG);
      const location = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      const deviceAdmin = await DeviceAdminModule.isDeviceAdminEnabled();
      const camera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      const microphone = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      const foregroundService = await PermissionsModule.isForegroundServiceEnabled();

      setPermissions({
        isAccessibilityEnabled: accessibility,
        isNotificationListenerEnabled: notification,
        hasCallLogPermission: callLog,
        hasLocationPermission: location,
        isDeviceAdminEnabled: deviceAdmin,
        hasCameraPermission: camera,
        hasMicrophonePermission: microphone,
        isForegroundServiceEnabled: foregroundService,
      });
    } catch (e) {
      console.error("Error checking permissions", e);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const interval = setInterval(checkAllPermissions, 3000); // Re-check every 3 seconds
      return () => clearInterval(interval);
    }
  }, [checkAllPermissions]);

  const requestCallLogPermission = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        {
          title: 'Call Log Permission',
          message: 'This app needs access to your call logs to monitor calls.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Call log permission granted');
        checkAllPermissions();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app needs access to your location for geofencing and location tracking.",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Fine location permission granted");
        checkAllPermissions();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "This app needs access to your camera for remote viewing.",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Camera permission granted");
        checkAllPermissions();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const requestMicrophonePermission = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "This app needs access to your microphone for remote listening.",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Microphone permission granted");
        checkAllPermissions();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const allPermissionsGranted =
    permissions.isAccessibilityEnabled &&
    permissions.isNotificationListenerEnabled &&
    permissions.hasCallLogPermission &&
    permissions.hasLocationPermission &&
    permissions.isDeviceAdminEnabled &&
    permissions.hasCameraPermission &&
    permissions.hasMicrophonePermission &&
    permissions.isForegroundServiceEnabled;

  if (allPermissionsGranted && Platform.OS === 'android') {
    // If all permissions are granted, navigate to the main app
    // The layout will handle the check and redirect to dashboard
    router.replace('/(tabs)');
    return null; // Render nothing while redirecting
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>GuardianChild</Text>
        <Text style={styles.subtitle}>This app is designed for mobile use.</Text>
        <Text>Please open on an Android device to complete the setup.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Required Setup', headerLeft: () => null }} />
      <View style={styles.header}>
        <Text style={styles.title}>One More Step!</Text>
        <Text style={styles.subtitle}>To protect this device, please enable the following services.</Text>
      </View>

      <View style={styles.permissionList}>
        <ListItem
          title="Web & App Filtering"
          status={permissions.isAccessibilityEnabled}
          onFix={() => WebFilteringModule.requestAccessibilityPermission()}
        />
        <ListItem
          title="Notification Access"
          status={permissions.isNotificationListenerEnabled}
          onFix={() => PermissionsModule.requestNotificationListenerPermission()}
        />
        <ListItem
          title="Call Log Access"
          status={permissions.hasCallLogPermission}
          onFix={requestCallLogPermission}
        />
        <ListItem
          title="Location Access"
          status={permissions.hasLocationPermission}
          onFix={requestLocationPermission}
        />
        <ListItem
          title="Device Admin"
          status={permissions.isDeviceAdminEnabled}
          onFix={() => DeviceAdminModule.requestDeviceAdminPermission()}
        />
        <ListItem
          title="Camera Access"
          status={permissions.hasCameraPermission}
          onFix={requestCameraPermission}
        />
        <ListItem
          title="Microphone Access"
          status={permissions.hasMicrophonePermission}
          onFix={requestMicrophonePermission}
        />
        <ListItem
          title="Foreground Service"
          status={permissions.isForegroundServiceEnabled}
          onFix={() => PermissionsModule.requestForegroundServicePermission()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
  },
  permissionList: {
    padding: 10,
  },
  listItem: {
    backgroundColor: '#f7f7f7',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listItemText: {
    fontSize: 16,
    flex: 1, // Take available space
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginRight: 10,
    fontWeight: 'bold',
  },
});