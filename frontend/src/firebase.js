import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// Check if credentials are placeholders or empty
export const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "" && 
  firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY_HERE" &&
  firebaseConfig.appId !== "YOUR_APP_ID_HERE";

let app = null;
let auth = null;
let googleProvider = null;
let db = null;
let firestore = null;
let storage = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    // Force Google to show the account selector screen every time
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    db = getDatabase(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase Initialization Failed:", error);
  }
}

export { auth, googleProvider, db, firestore, storage };


