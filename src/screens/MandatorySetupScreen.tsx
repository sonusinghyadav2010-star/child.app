
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, NativeModules, AppState } from 'react-native';
import SharedPreferences from '../services/SharedPreferences';
import WebFiltering from '../services/WebFiltering';

const { PermissionsModule, WebRTCModule } = NativeModules;

interface Props {
  onSetupComplete: () => void;
}

const MandatorySetupScreen: React.FC<Props> = ({ onSetupComplete }) => {
    const [permissions, setPermissions] = useState({
        location: false,
        camera: false,
        microphone: false,
        webFiltering: false,
        notification: false,
        deviceAdmin: false,
        screenCapture: false, // Added screen capture permission
    });

    const checkAllPermissions = async () => {
        const location = await PermissionsModule.isLocationPermissionGranted();
        const camera = await PermissionsModule.isCameraPermissionGranted();
        const microphone = await PermissionsModule.isMicrophonePermissionGranted();
        const webFiltering = await WebFiltering.isAccessibilityServiceEnabled();
        const notification = await PermissionsModule.isNotificationListenerPermissionGranted();
        const deviceAdmin = await PermissionsModule.isDeviceAdminPermissionGranted();
        // We can't truly "check" screen capture permission beforehand in the same way,
        // but we can track if the user has completed the action.
        const screenCapture = await SharedPreferences.getBool('screenCapturePermissionGranted');
        setPermissions({ location, camera, microphone, webFiltering, notification, deviceAdmin, screenCapture });
    };

    useEffect(() => {
        checkAllPermissions();
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                checkAllPermissions();
            }
        });
        return () => {
            subscription.remove();
        };
    }, []);

    const allPermissionsGranted = Object.values(permissions).every(p => p);

    useEffect(() => {
        if (allPermissionsGranted) {
            SharedPreferences.setBool('permissionsSetupComplete', true);
            onSetupComplete();
        }
    }, [allPermissionsGranted, onSetupComplete]);

    const requestPermission = async (permission: keyof typeof permissions) => {
        switch (permission) {
            case 'location':
                PermissionsModule.requestLocationPermission();
                break;
            case 'camera':
                PermissionsModule.requestCameraPermission();
                break;
            case 'microphone':
                PermissionsModule.requestMicrophonePermission();
                break;
            case 'webFiltering':
                WebFiltering.requestAccessibilityPermission();
                break;
            case 'notification':
                PermissionsModule.requestNotificationListenerPermission();
                break;
            case 'deviceAdmin':
                PermissionsModule.requestDeviceAdminPermission();
                break;
            case 'screenCapture':
                try {
                    await WebRTCModule.requestScreenCapturePermission();
                    // If the user grants permission, we'll mark it as complete.
                    await SharedPreferences.setBool('screenCapturePermissionGranted', true);
                    setPermissions(prev => ({ ...prev, screenCapture: true }));
                } catch (e) {
                    console.error('Screen capture permission was denied', e);
                    // Optionally, show feedback to the user
                }
                break;
        }
    };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mandatory Setup</Text>
      {Object.keys(permissions).map(p => (
        <View style={styles.permissionContainer} key={p}>
            <Text>{p.charAt(0).toUpperCase() + p.slice(1).replace(/([A-Z])/g, ' $1')}</Text>
            {permissions[p] ? (
                <Text style={styles.granted}>Granted</Text>
            ) : (
                <Button title="Grant" onPress={() => requestPermission(p as keyof typeof permissions)} />
            )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  permissionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  granted: {
    color: 'green',
  },
});

export default MandatorySetupScreen;
