
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Stack, useRouter } from 'expo-router';

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
    try {
      // Basic validation
      const parsedData = JSON.parse(data);
      if (!parsedData.parentUid || !parsedData.parentEmail) {
        throw new Error("QR code is missing required fields.");
      }
      router.push({ pathname: '/confirm-pairing', params: { qrData: data } });
    } catch (e) {
      Alert.alert('Invalid QR Code', 'The scanned QR code does not contain valid pairing data.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    }
  };
  
  const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'QR Scanner' }} />
        <Text>Requesting for camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.centeredView}>
        <Stack.Screen options={{ title: 'QR Scanner' }} />
        <Text style={{ margin: 10, textAlign: 'center' }}>Camera permission is required to scan the QR code.</Text>
        <Button title={'Grant Camera Permission'} onPress={getBarCodeScannerPermissions} />
        <View style={styles.separator} />
        <Button title={'Enter Code Manually Instead'} onPress={() => router.push('/manual-pairing')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Scan QR Code' }} />
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <Text style={styles.scanText}>Scan the QR code from the parent app</Text>
        <View style={styles.manualButtonContainer}>
           <Button title={'Or Enter Code Manually'} onPress={() => router.push('/manual-pairing')} color="white" />
        </View>
        {scanned && <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
  },
  scanText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 50,
  },
  manualButtonContainer: {
      marginBottom: 30,
      padding: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 5,
  },
   separator: {
    marginVertical: 15,
  },
});
