
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../src/firebase/firebaseConfig';

export default function ManualPairingScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code from the parent app.');
      return;
    }

    setIsLoading(true);

    try {
      // The parent app should create a document in 'pairingCodes' with the code as the ID
      // This document contains the parent's UID and email.
      const q = query(collection(db, "pairingCodes"), where("code", "==", code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Code Not Found', 'The code is incorrect or has expired. Please try again.');
        setIsLoading(false);
        return;
      }

      // Assuming one code corresponds to one parent
      const pairingDoc = querySnapshot.docs[0].data();
      const { parentUid, parentEmail } = pairingDoc;

      if (!parentUid || !parentEmail) {
          Alert.alert('Pairing Error', 'The pairing code is invalid. Please generate a new one from the parent app.');
          setIsLoading(false);
          return;
      }

      // Pass the retrieved data to the confirmation screen, same as QR flow
      const qrData = JSON.stringify({ parentUid, parentEmail });
      router.push({ pathname: '/confirm-pairing', params: { qrData } });

    } catch (error) {
      console.error("Manual Pairing Error: ", error);
      Alert.alert('Error', 'An unexpected error occurred. Please check your internet connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Enter Pairing Code' }} />
      <Text style={styles.title}>Enter Code</Text>
      <Text style={styles.instructions}>Enter the 6-digit code displayed on your parent's dashboard.</Text>
      <TextInput
        style={styles.input}
        placeholder="123456"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <Button title="Connect" onPress={handleConnect} disabled={code.length < 6} />
      )}
       <Button title="Scan QR Code Instead" onPress={() => router.replace('/qr-scanner')} color="#555" />
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  input: {
    fontSize: 32,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 30,
    textAlign: 'center',
    width: '80%',
    letterSpacing: 8,
  },
});
