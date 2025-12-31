
import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, Button } from 'react-native';
import { usePermissions } from '../hooks/usePermissions';
import SharedPreferences from '../services/SharedPreferences';

interface MandatorySetupScreenProps {
  onSetupComplete: () => void;
}

// Define the list of permissions required for the app to function.
const REQUIRED_PERMISSIONS = [
  'location',
  'callLog',
  'sms',
  'storage',
  'camera',
  'audio',
  'usageStats',
  'accessibility',
  'notification',
  'deviceAdmin',
];

function MandatorySetupScreen({ onSetupComplete }: MandatorySetupScreenProps) {
  const { permissions, allPermissionsGranted, requestAllPermissions } = usePermissions(REQUIRED_PERMISSIONS);

  const handleComplete = async () => {
    await SharedPreferences.setBool('permissionsSetupComplete', true);
    onSetupComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Mandatory Setup</Text>
        <Text style={styles.subtitle}>The following permissions are required to use the app:</Text>

        {REQUIRED_PERMISSIONS.map((permissionKey) => (
          <View key={permissionKey} style={styles.permissionRow}>
            <Text style={styles.permissionText}>{permissionKey}</Text>
            <Text style={permissions[permissionKey] ? styles.statusGranted : styles.statusDenied}>
              {permissions[permissionKey] ? 'Granted' : 'Denied'}
            </Text>
          </View>
        ))}

        <View style={styles.buttonContainer}>
          {allPermissionsGranted ? (
            <Button title="Complete Setup" onPress={handleComplete} />
          ) : (
            <Button title="Request Permissions" onPress={requestAllPermissions} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  permissionText: {
    fontSize: 16,
  },
  statusGranted: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
  },
  statusDenied: {
    fontSize: 16,
    color: 'red',
  },
  buttonContainer: {
    marginTop: 30,
  },
});

export default MandatorySetupScreen;
