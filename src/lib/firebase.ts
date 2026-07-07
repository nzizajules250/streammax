import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Injected Firebase configuration
const firebaseConfig = {
  projectId: "ntwara",
  appId: "1:930556837311:web:4a0a3de26d7da74e92350a",
  apiKey: "AIzaSyC4rl-AddC1sPsxC8c7OQknkiojruIpY0w",
  authDomain: "ntwara.firebaseapp.com",
  storageBucket: "ntwara.firebasestorage.app",
  messagingSenderId: "930556837311",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the databaseId provided in firebase-applet-config.json
const databaseId = "ai-studio-0011f243-99c0-4cc0-b1a5-5c18729083f6";
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
