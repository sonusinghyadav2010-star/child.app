import {
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

/**
 * Signs in a user with email and password.
 * @param email The user's email.
 * @param password The user's password.
 * @returns A Promise that resolves with the user credential.
 */
export async function signInWithEmailAndPassword(email: string, password: string) {
  return firebaseSignInWithEmailAndPassword(auth, email, password);
}

/**
 * Creates and signs in an anonymous user.
 * @returns A Promise that resolves with the user credential.
 */
export async function createAnonymousUser() {
  return firebaseSignInAnonymously(auth);
}

/**
 * Returns the current authenticated Firebase user.
 * @returns The current Firebase User object, or null if no user is signed in.
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Signs out the current user.
 * @returns A Promise that resolves when the user is signed out.
 */
export async function signOut() {
  return firebaseSignOut(auth);
}

/**
 * Validates the current user's authentication token.
 * This function is a placeholder; Firebase SDKs typically handle token validation automatically.
 * It attempts to get the ID token, which will refresh it if expired, thus validating the session.
 * @returns A Promise that resolves if the token can be retrieved, otherwise rejects.
 */
export async function validateToken(): Promise<string> {
  const user = getCurrentUser();
  if (user) {
    try {
      const idToken = await user.getIdToken(true); // true forces token refresh if expired
      return idToken;
    } catch (error) {
      console.error('Failed to get ID token:', error);
      throw new Error('Authentication token is invalid or expired.');
    }
  } else {
    throw new Error('No user is currently signed in.');
  }
}