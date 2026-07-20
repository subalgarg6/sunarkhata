/**
 * SunarKhata — Firebase Configuration
 *
 * Initializes the Firebase App and exports the Auth instance.
 * All Firebase environment variables use the VITE_ prefix for Vite compatibility.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return null;
};

const firebaseConfig = {
  apiKey:            getEnv('VITE_FIREBASE_API_KEY'),
  authDomain:        getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId:         getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             getEnv('VITE_FIREBASE_APP_ID'),
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Initialize Firebase App
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

// Export Auth instance
export const firebaseAuth = app ? getAuth(app) : null;
