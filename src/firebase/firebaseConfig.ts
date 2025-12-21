import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

// Optionally import and configure other Firebase services if needed
// import { getAnalytics } from 'firebase/analytics';
// import { getRemoteConfig } from 'firebase/remote-config';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

// Enable Firebase emulators if in development mode
if (__DEV__) {
  // Check if running on web to avoid emulator connection issues in native build
  if (typeof window !== 'undefined') { // Check for window object to determine if it's web
    console.log('Connecting to Firebase emulators...');
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
    } catch (e) {
      console.warn('Firebase emulator connection failed (this is expected if emulators are not running):', e);
    }
  } else {
    // For native platforms, you might need to adjust the host to your local IP or use '10.0.2.2' for Android emulator
    // Or configure through a Firebase.json for native setup
    console.warn('Firebase emulators for native platforms need specific host configuration (e.g., 10.0.2.2 for Android emulator).');
    console.warn('Emulators not connected for native development environment by default in this setup.');
  }
}

// Optionally export other initialized services
// export const analytics = getAnalytics(app);
// export const remoteConfig = getRemoteConfig(app);
