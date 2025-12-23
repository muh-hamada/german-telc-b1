import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// These should match your existing Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyDFo-OqvCmtxYMYQq3RJ9fGJwxfxpMnJmg",
  authDomain: "telc-b1-german.firebaseapp.com",
  projectId: "telc-b1-german",
  storageBucket: "telc-b1-german.firebasestorage.app",
  messagingSenderId: "945287902370",
  appId: "1:945287902370:web:e1ae5b41b7b5a2b4f36e50",
  measurementId: "G-FHWB32DM3N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

