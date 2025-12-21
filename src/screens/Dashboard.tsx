
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, NativeModules, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you use Expo vector icons

const { PermissionsModule, ForegroundServiceModule } = NativeModules;

// A single status item on the dashboard
const StatusItem = ({ label, isSuccess }) => (
  <View style={styles.statusItem}>
    <Text style={styles.statusLabel}>{label}</Text>
    <Text style={isSuccess ? styles.statusSuccess : styles.statusError}>
      {isSuccess ? '✅' : '❌'}
    </Text>
  </View>
);

// The settings menu (conceptual)
const SettingsMenu = ({ onRestart, onRecheck, onOpenSettings }) => (
  <View style={styles.settingsMenu}>
      <Button title="Re-check Permissions" onPress={onRecheck} />
      <Button title="Open System Settings" onPress={onOpenSettings} />
      <Button title="Restart Background Services" onPress={onRestart} />
  </View>
);

function Dashboard() {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [serviceRunning, setServiceRunning] = useState(false);
  const [isPaired, setIsPaired] = useState(false); // Pairing status is not implemented yet
  const [showSettings, setShowSettings] = useState(false);

  const checkAllPermissions = async () => {
    const location = await PermissionsModule.isLocationPermissionGranted();
    const camera = await PermissionsModule.isCameraPermissionGranted();
    const microphone = await PermissionsModule.isMicrophonePermissionGranted();
    const accessibility = await PermissionsModule.isAccessibilityPermissionGranted();
    const notification = await PermissionsModule.isNotificationListenerPermissionGranted();
    const deviceAdmin = await PermissionsModule.isDeviceAdminPermissionGranted();
    const allGranted = location && camera && microphone && accessibility && notification && deviceAdmin;
    setPermissionsGranted(allGranted);
  };

  const checkServiceStatus = async () => {
    const running = await ForegroundServiceModule.isServiceRunning();
    setServiceRunning(running);
  };

  useEffect(() => {
    checkAllPermissions();
    checkServiceStatus();
  }, []);

  const handleRestartServices = () => {
    ForegroundServiceModule.stopLocationService();
    setTimeout(() => ForegroundServiceModule.startLocationService(), 1000);
    setShowSettings(false);
  };

  const handleRecheckPermissions = () => {
    checkAllPermissions();
    setShowSettings(false);
  };

  const handleOpenSettings = () => {
    PermissionsModule.openAppSettings();
    setShowSettings(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Ionicons name="ellipsis-vertical" size={24} color="black" onPress={() => setShowSettings(!showSettings)} />
      </View>

      {showSettings && (
        <SettingsMenu 
          onRestart={handleRestartServices} 
          onRecheck={handleRecheckPermissions}
          onOpenSettings={handleOpenSettings}
        />
      )}

      <View style={styles.statusContainer}>
        <StatusItem label="All Permissions Granted" isSuccess={permissionsGranted} />
        <StatusItem label="Background Service Running" isSuccess={serviceRunning} />
        <StatusItem label="Device Paired" isSuccess={isPaired} />
      </View>

      {Platform.OS !== 'android' && 
        <View style={styles.qrCodeContainer}>
          <Text style={styles.qrCodeText}>QR scanning works only in the Android app</Text>
        </View>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContainer: {
    padding: 20,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  statusLabel: {
    fontSize: 16,
  },
  statusSuccess: {
    fontSize: 20,
  },
  statusError: {
    fontSize: 20,
  },
  settingsMenu: {
    backgroundColor: '#FFF',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
   qrCodeContainer: {
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  qrCodeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default Dashboard;
