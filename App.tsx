
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import Dashboard from './src/screens/Dashboard';
import MandatorySetupScreen from './src/screens/MandatorySetupScreen';
import SharedPreferences from './src/services/SharedPreferences';
import useBackgroundServices from './src/hooks/useBackgroundServices';
import { initializeHeartbeat } from './src/services/Heartbeat';

function App() {
  const [permissionsSetupComplete, setPermissionsSetupComplete] = useState<boolean | null>(null);

  // TODO: Replace with actual UIDs
  const childUid = 'child123';
  const parentUid = 'parent123';

  // This hook will automatically start/stop services when permissions change
  useBackgroundServices(permissionsSetupComplete, childUid, parentUid);

  // On initial load, check if setup was previously completed.
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const isComplete = await SharedPreferences.getBool('permissionsSetupComplete');
        setPermissionsSetupComplete(isComplete);
      } catch (e) {
        console.error("Error reading setup status from SharedPreferences", e);
        setPermissionsSetupComplete(false); // Assume setup is incomplete on error
      }
    };

    checkSetupStatus();
  }, []);

  // New effect to handle the heartbeat
  useEffect(() => {
    if (permissionsSetupComplete === true) {
      // Start the heartbeat service
      initializeHeartbeat();
    } 
    // Note: The heartbeat service runs in the background and handles its own state,
    // so it doesn't need to be explicitly stopped when permissionsSetupComplete is false,
    // as the app should be back on the setup screen.
  }, [permissionsSetupComplete]);

  const handleSetupComplete = () => {
    setPermissionsSetupComplete(true);
  };

  // While checking for setup status, show a loading indicator.
  if (permissionsSetupComplete === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  // Render the appropriate screen based on setup status.
  return (
    <SafeAreaView style={styles.container}>
      {permissionsSetupComplete ? (
        <Dashboard />
      ) : (
        <MandatorySetupScreen onSetupComplete={handleSetupComplete} />
      )}
    </SafeAreaView>
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
});

export default App;
