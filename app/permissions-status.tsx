import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { checkPermissionStatus, requestPermission, openAppSettings } from '../src/permissions/permissionUtils';
import { auth } from '../src/firebase/firebaseConfig';
import { isConsentGranted } from '../src/permissions/permissionService';
import { Button } from 'react-native'; // Assuming a simple Button component

interface PermissionItemProps {
  permissionType: string;
  rationale: string;
  onCheck: (type: string) => Promise<boolean>;
  onRequest: (type: string, rationale: string) => Promise<boolean>;
}

const PermissionItem: React.FC<PermissionItemProps> = ({ permissionType, rationale, onCheck, onRequest }) => {
  const [status, setStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    const { status: currentStatus } = await onCheck(permissionType);
    setStatus(currentStatus);
  }, [permissionType, onCheck]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleRequest = async () => {
    setLoading(true);
    const result = await onRequest(permissionType, rationale);
    if (result) {
      await checkStatus(); // Re-check status after request
      Alert.alert("Success", `${permissionType} permission granted.`);
    } else {
      Alert.alert("Denied", `${permissionType} permission was not granted. Please try again or grant manually in settings.`);
    }
    setLoading(false);
  };

  const getStatusText = () => {
    if (status === null) return "Checking...";
    return status ? "Granted" : "Denied";
  };

  const getStatusColor = () => {
    if (status === null) return "gray";
    return status ? "green" : "red";
  };

  return (
    <View style={styles.permissionItem}>
      <Text style={styles.permissionType}>{permissionType}</Text>
      <Text style={styles.rationaleText}>{rationale}</Text>
      <View style={styles.statusRow}>
        <Text style={{ color: getStatusColor() }}>Status: {getStatusText()}</Text>
        {!status && (
          <Button
            title={loading ? "Loading..." : "Grant"}
            onPress={handleRequest}
            disabled={loading}
          />
        )}
      </View>
    </View>
  );
};

export default function PermissionsStatusScreen() {
  const router = useRouter();
  const [allPermissionsGranted, setAllPermissionsGranted] = useState(false);
  const [loadingInitialCheck, setLoadingInitialCheck] = useState(true);

  const PERMISSIONS = [
    { type: 'CAMERA', rationale: "Camera access is needed for various monitoring features." },
    { type: 'RECORD_AUDIO', rationale: "Microphone access is needed for audio monitoring." },
    { type: 'ACCESS_FINE_LOCATION', rationale: "Location access (foreground and background) is needed to track device location." },
    { type: 'WRITE_EXTERNAL_STORAGE', rationale: "Storage access is needed to store media and other data." }, // Covers media permissions for older Android, or use specific READ_MEDIA_*
    { type: 'POST_NOTIFICATIONS', rationale: "Notification permission is needed for foreground service notifications and alerts." },
    { type: 'SYSTEM_ALERT_WINDOW', rationale: "Permission to draw over other apps is required for parental controls overlays." },
    { type: 'BIND_NOTIFICATION_LISTENER_SERVICE', rationale: "Notification Listener access is required to monitor device notifications." },
    { type: 'BIND_ACCESSIBILITY_SERVICE', rationale: "Accessibility Service is required for app blocking and usage monitoring." },
    { type: 'DEVICE_ADMIN', rationale: "Device Administrator privileges may be used for remote device management features." },
    { type: 'MEDIA_PROJECTION', rationale: "Screen capture permission is required to monitor screen activity." },
  ];

  const performInitialCheck = useCallback(async () => {
    setLoadingInitialCheck(true);
    const results = await Promise.all(PERMISSIONS.map(p => checkPermissionStatus(p.type)));
    const allGranted = results.every(res => res.status === true);
    setAllPermissionsGranted(allGranted);
    setLoadingInitialCheck(false);
  }, []);

  useEffect(() => {
    performInitialCheck();
  }, [performInitialCheck]);

  const handleDone = () => {
    // Ideally, you'd re-check all permissions one last time here
    // If all are granted, proceed to the main app
    router.replace('/(tabs)');
  };

  const handleRequestWrapper = async (type: string, rationale: string) => {
    const result = await requestPermission(type, rationale);
    // After any request, re-check all to update the overall status
    performInitialCheck();
    return result.granted;
  };

  const handleCheckWrapper = async (type: string) => {
    const { status: currentStatus } = await checkPermissionStatus(type);
    // No need to call performInitialCheck here, as it's called after requests
    return currentStatus;
  };

  if (loadingInitialCheck) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading permissions status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Permissions Setup' }} />
      <Text style={styles.header}>App Permissions Required</Text>
      <Text style={styles.subheader}>Please grant the following permissions for the app to function correctly. Each permission has a specific purpose explained below.</Text>

      <ScrollView style={styles.scrollView}>
        {PERMISSIONS.map((p) => (
          <PermissionItem
            key={p.type}
            permissionType={p.type}
            rationale={p.rationale}
            onCheck={handleCheckWrapper}
            onRequest={handleRequestWrapper}
          />
        ))}
      </ScrollView>

      {allPermissionsGranted ? (
        <View style={styles.footer}>
          <Text style={styles.allGrantedText}>All required permissions granted!</Text>
          <Button title="Continue to App" onPress={handleDone} />
        </View>
      ) : (
        <View style={styles.footer}>
          <Text style={styles.notAllGrantedText}>Some permissions are still pending. Please grant all to continue.</Text>
          <Button title="Open App Settings" onPress={openAppSettings} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  permissionItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  permissionType: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  rationaleText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  allGrantedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 10,
  },
  notAllGrantedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 10,
  },
});