import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { app } from './firebaseConfig'; // Assuming 'app' is exported from firebaseConfig.ts

const functions = getFunctions(app);

// Connect to Functions emulator if in development
if (__DEV__) {
  // For Android emulator, use '10.0.2.2' if running on your machine
  // For iOS simulator/web, 'localhost' usually works
  // Ensure your functions emulator is running on this port (default 5001)
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Connected to Firebase Functions emulator.');
  } catch (e) {
    console.warn('Could not connect to Functions emulator:', e);
  }
}

// Callable function to link a child device
export const linkChildDevice = httpsCallable<any, { status: string, message: string }>(functions, 'linkChildDevice');