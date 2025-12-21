
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator, NativeModules, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/firebase/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';

const { WebFilteringModule } = NativeModules;

export default function ConfirmPairingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState<{ parentUid?: string; parentEmail?: string } | null>(null);

  useEffect(() => {
    try {
      if (typeof params.qrData === 'string') {
        const parsedData = JSON.parse(params.qrData);
        if (parsedData.parentUid && parsedData.parentEmail) {
          setQrData(parsedData);
        } else {
          throw new Error('QR code is missing required fields.');
        }
      } else {
        throw new Error('No QR data received.');
      }
    } catch (e) {
      Alert.alert('Invalid QR Code', 'The scanned QR code does not contain valid pairing data.', [
        { text: 'OK', onPress: () => router.replace('/qr-scanner') },
      ]);
    }
  }, [params.qrData]);

  const handleConfirmPairing = async () => {
    if (!qrData?.parentUid) {
      Alert.alert('Error', 'Parent information is missing. Please scan again.');
      return;
    }

    setIsLoading(true);

    try {
      const parentUid = qrData.parentUid;

      // 1. Create a new document for the child in the top-level 'children' collection
      // This collection can be used for administrative purposes
      const childDocRef = await addDoc(collection(db, 'children'), {
        pairedAt: serverTimestamp(),
        parentUid: parentUid,
      });
      const childUid = childDocRef.id;

      // 2. Add a reference to the child in the parent's 'children' sub-collection
      const parentChildRef = doc(db, 'users', parentUid, 'children', childUid);
      await setDoc(parentChildRef, { 
          addedAt: serverTimestamp(),
          // In the future, you could add device info here e.g., deviceName: "..."
      });

      // 3. Store pairing info in AsyncStorage for React Native use
      await AsyncStorage.setItem('parentUid', parentUid);
      await AsyncStorage.setItem('childUid', childUid);

      // 4. Pass the pairing info to the native module for background services
      if (Platform.OS === 'android' && WebFilteringModule) {
        await WebFilteringModule.setPairingInfo(parentUid, childUid);
        console.log('Pairing info sent to native module.');
      }

      Alert.alert('Success!', `This device is now paired with ${qrData.parentEmail}. Monitoring is active.`);
      
      // 5. Navigate to the dashboard
      router.replace('/(tabs)/dashboard');

    } catch (error) {
      console.error("Pairing Error: ", error);
      let errorMessage = 'An error occurred while pairing. Please try again.';
      if (error instanceof Error) {
          errorMessage = error.message;
      }
      Alert.alert('Pairing Failed', errorMessage);
      setIsLoading(false);
    }
  };

  if (!qrData) {
    return (
        <View style={styles.container}>
            <ActivityIndicator />
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Confirm Pairing' }} />
      <Text style={styles.title}>Pair with Parent?</Text>
      <Text style={styles.text}>A request was received to pair this device with the following account:</Text>
      <Text style={styles.email}>{qrData.parentEmail}</Text>
      <Text style={styles.warning}>By confirming, you allow this account to monitor this device's activity.</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={() => router.replace('/qr-scanner')} color="#FF3B30" />
            <Button title="Confirm & Pair" onPress={handleConfirmPairing} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  email: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#000',
  },
  warning: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 30,
      color: '#666',
      paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});
