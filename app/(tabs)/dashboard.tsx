
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Alert, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from '../../src/firebase/firebaseConfig';

const { CallLogModule, WebRTCModule, ScreenShareModule } = NativeModules;

export default function DashboardScreen() {
  const [isServiceEnabled, setIsServiceEnabled] = useState(false);
  const [parentEmail, setParentEmail] = useState<string | null>(null);

  useEffect(() => {
    if (WebRTCModule) {
      WebRTCModule.startListening();
    }

    let screenShareUnsubscribe = () => {};

    const setupListeners = async () => {
      const parentUid = await AsyncStorage.getItem('parentUid');
      const childUid = await AsyncStorage.getItem('childUid');

      if (parentUid && childUid) {
        // Screen Share Listener
        const screenShareDocRef = doc(db, "users", parentUid, "children", childUid);
        screenShareUnsubscribe = onSnapshot(screenShareDocRef, (doc) => {
            const data = doc.data();
            if (data && data.screenMonitoring) {
                handleScreenShareRequest(true);
            } else {
                handleScreenShareRequest(false);
            }
        });

        // Fetch parent email for display
        try {
          const parentDocRef = doc(db, "users", parentUid);
          const parentDoc = await getDoc(parentDocRef);
          if (parentDoc.exists()) {
            setParentEmail(parentDoc.data().email || 'N/A');
          }
        } catch (error) {
          console.log("Error fetching parent email: ", error);
        }

      } 
    };
    
    setupListeners();

    return () => {
      if (WebRTCModule) {
        WebRTCModule.close();
      }
      screenShareUnsubscribe();
    };
  }, []);

  const handleScreenShareRequest = async (shouldStart: boolean) => {
      if (shouldStart) {
          try {
              const permissionGranted = await ScreenShareModule.requestScreenSharePermission();
              if (permissionGranted) {
                  WebRTCModule.toggleScreenShare(true);
              }
          } catch (error) {
              console.error("Screen share permission denied or failed", error);
          }
      } else {
          WebRTCModule.toggleScreenShare(false);
      }
  };

  const handleSyncCallLog = async () => {
    try {
      const hasPermission = true; // Assuming permission is already granted
      if (hasPermission) {
        const callLogs = await CallLogModule.getCallLogHistory();
        
        const parentUid = await AsyncStorage.getItem('parentUid');
        const childUid = await AsyncStorage.getItem('childUid');

        if (!parentUid || !childUid) {
          Alert.alert("Error", "Pairing information not found. Cannot sync data.");
          return;
        }

        const callLogCollectionRef = collection(db, "users", parentUid, "children", childUid, "callLogs");
        
        const batch = [];
        for (const log of callLogs) {
            batch.push(addDoc(callLogCollectionRef, { ...log, syncedAt: serverTimestamp() }));
        }

        await Promise.all(batch);
        
        Alert.alert('Success', `Successfully synced ${callLogs.length} call log entries.`);
      } else {
        Alert.alert('Permission Denied', 'Call log permission is required to sync history.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to sync call log history.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Guardian Child</Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Device Status: <Text style={styles.active}>Protected</Text></Text>
        {parentEmail && <Text style={styles.statusText}>Paired with: <Text style={styles.email}>{parentEmail}</Text></Text>}
      </View>

      <View style={styles.moduleContainer}>
        <Text style={styles.moduleTitle}>Monitoring Features</Text>
        <Text>Web History: Active</Text>
        <Text>App Usage: Active</Text>
        <Text>SMS Logging: Active</Text>
        <Text>Location Tracking: Active</Text>
        <Text>Screen Sharing: Ready</Text>
      </View>
      
      <View style={styles.actionContainer}>
        <Text style={styles.moduleTitle}>Manual Sync</Text>
        <Button title="Sync Latest 10 Call Logs" onPress={handleSyncCallLog} />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2, // for Android shadow
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
  },
  active: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  email: {
    fontWeight: 'bold',
    color: '#007AFF'
  },
  moduleContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  actionContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
  }
});
