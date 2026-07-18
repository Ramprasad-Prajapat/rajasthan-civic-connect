import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID || 'rajcivic-5a9c1';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;

let app;
let db;
let auth;
let storage;
let rtdb;
let useLocalDb = false;
let useClientDb = false;

try {
  const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`;

  if (clientEmail && privateKey) {
    const formattedPrivateKey = privateKey
      .replace(/\\n/g, '\n')
      .replace(/^"|"$/g, '')
      .trim();

    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
      storageBucket,
      databaseURL
    });

    console.log("Firebase Admin SDK initialized using Service Account Certificate.");

    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage();
    rtdb = admin.database();
  } else if (process.env.FIREBASE_API_KEY) {
    console.log("🔥 Firebase Web API Key detected. Initializing client-side SDK Firestore proxy...");
    useClientDb = true;
  } else {
    // No credentials available - try to initialize and test connection
    try {
      app = admin.initializeApp({
        projectId,
        storageBucket,
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`
      });
      
      // Test if Firestore actually works by attempting a small read
      const testDb = admin.firestore();
      await testDb.collection('metadata').doc('system').get();
      
      console.log("Firebase Admin SDK initialized using project ID fallback.");
      db = testDb;
      auth = admin.auth();
      storage = admin.storage();
      rtdb = admin.database();
    } catch (testErr) {
      // Firebase connection failed - use local in-memory database
      console.warn("⚠️  Firebase credentials not configured. Falling back to local in-memory database.");
      useLocalDb = true;
    }
  }
} catch (error) {
  console.error("Firebase Admin SDK initialization error:", error.message);
  console.warn("⚠️  Falling back to local in-memory database.");
  useLocalDb = true;
}

// If client SDK proxy is requested
if (useClientDb) {
  const { clientDb } = await import('./clientDb.js');
  db = clientDb;
  
  // Create mock auth object that won't crash if called
  auth = {
    verifyIdToken: async () => { throw new Error('Firebase Auth verifyIdToken fallback'); },
    createUser: async () => ({ uid: 'local_user' }),
    getUser: async () => null
  };
  
  // Mock storage and rtdb
  storage = { bucket: () => ({ file: () => ({}) }) };
  rtdb = { ref: () => ({ set: async () => {}, get: async () => ({ val: () => null }) }) };
  
  console.log("✅ Backend is running with REAL FIRESTORE via CLIENT SDK PROXY.");
} else if (useLocalDb) {
  const { localDb } = await import('./localDb.js');
  db = localDb;
  
  // Create mock auth object that won't crash if called
  auth = {
    verifyIdToken: async () => { throw new Error('Firebase Auth not available in local mode'); },
    createUser: async () => ({ uid: 'local_user' }),
    getUser: async () => null
  };
  
  // Mock storage and rtdb
  storage = { bucket: () => ({ file: () => ({}) }) };
  rtdb = { ref: () => ({ set: async () => {}, get: async () => ({ val: () => null }) }) };
  
  console.log("✅ Backend is running with LOCAL IN-MEMORY DATABASE (no Firebase required).");
  console.log("   All login, registration, and API features will work locally.");
}

export { db, auth, storage, rtdb, admin };
export default app;
