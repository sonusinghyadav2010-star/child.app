import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { linkChildDevice } from '../src/firebase/cloudFunctions';
import { createAnonymousUser } from '../src/auth/authService';

interface QRData {
  parentUid: string;
  timestamp: number;
  nonce: string;
  planId: string;
  deviceLimit: number;
  signature?: string; // Signature from parent app's backend
}

export default function ConfirmPairingScreen() {
  const { qrData: qrDataString } = useLocalSearchParams();
  const router = useRouter();
  const [parsedQRData, setParsedQRData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'pairing' | 'success' | 'failure'>('idle');

  useEffect(() => {
    if (qrDataString && typeof qrDataString === 'string') {
      try {
        const data: QRData = JSON.parse(qrDataString);
        setParsedQRData(data);
      } catch (e) {
        Alert.alert('Error', 'Failed to parse QR data.');
        router.back();
      }
    }
    setLoading(false);
  }, [qrDataString]);

  const handleConfirmPairing = async () => {
    if (!parsedQRData) return;

    setPairingStatus('pairing');
    try {
      // Ensure the child device is authenticated anonymously before linking
      await createAnonymousUser();
      // The linkChildDevice Cloud Function will use the child's auth token
      const result = await linkChildDevice({ qrData: parsedQRData, childDeviceName: 'Child Phone' });

      if (result.data.status === 'success') {
        Alert.alert('Success', result.data.message);
        setPairingStatus('success');
        // Navigate to the main app screen after successful pairing
        router.replace('/'); // Adjust based on your main app route
      } else {
        Alert.alert('Pairing Failed', result.data.message || 'Unknown error.');
        setPairingStatus('failure');
      }
    } catch (error: any) {
      console.error('Error linking device:', error);
      Alert.alert('Pairing Error', error.message || 'An unexpected error occurred during pairing.');
      setPairingStatus('failure');
    }
  };

  if (loading || !parsedQRData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Confirm Pairing' }} />
      <Text style={styles.title}>Confirm Pairing</Text>
      <Text style={styles.detailText}>Parent ID: {parsedQRData.parentUid}</Text>
      <Text style={styles.detailText}>Plan ID: {parsedQRData.planId}</Text>
      <Text style={styles.detailText}>Device Limit: {parsedQRData.deviceLimit}</Text>
      <Text style={styles.detailText}>Nonce: {parsedQRData.nonce}</Text>
      {parsedQRData.signature && <Text style={styles.detailText}>Signature: {parsedQRData.signature}</Text>}

      <Button
        title={pairingStatus === 'pairing' ? 'Pairing...' : 'Confirm & Pair'}
        onPress={handleConfirmPairing}
        disabled={pairingStatus === 'pairing'}
      />
      {pairingStatus === 'failure' && (
        <Button title="Try Again" onPress={() => router.back()} />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});