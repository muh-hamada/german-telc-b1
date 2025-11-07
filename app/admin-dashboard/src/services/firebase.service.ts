import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

class FirebaseService {
  private app: FirebaseApp;
  private firestoreInstance: Firestore;
  private authInstance: Auth;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.firestoreInstance = getFirestore(this.app);
    this.authInstance = getAuth(this.app);
  }

  getFirestore(): Firestore {
    return this.firestoreInstance;
  }

  getAuth(): Auth {
    return this.authInstance;
  }
}

const firebaseService = new FirebaseService();
export { firebaseService };

