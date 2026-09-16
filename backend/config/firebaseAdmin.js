// Firebase initialization with proper mode detection
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID || 'rajcivic-5a9c1';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`;

let app;
let db;
let auth;
let storage;
let rtdb;
let mode = process.env.AUTH_MODE === 'admin' ? 'admin' : process.env.AUTH_MODE === 'proxy' ? 'proxy' : 'local';

// Helper to log the selected mode
const logMode = () => {
  if (mode === 'admin') {
    console.log('✅ Firebase Admin SDK / Production Mode');
  } else if (mode === 'proxy') {
    console.log('✅ Firebase Client SDK Proxy / Development Mode');
  } else {
    console.log('✅ Local In-Memory Database Mode (no Firebase)');
  }
};

try {
  // Full service‑account credentials present → use Admin SDK
  if (clientEmail && privateKey) {
    const formattedPrivateKey = privateKey
      .replace(/\\n/g, '\n')
      .replace(/^"|"$/g, '')
      .trim();
    app = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey: formattedPrivateKey }),
      storageBucket,
      databaseURL,
    });
    console.log('Firebase Admin SDK initialized using Service Account Certificate.');
    mode = 'admin';
  } else {
    // No service‑account – attempt fallback Admin init (project‑id only)
    try {
      app = admin.initializeApp({ projectId, storageBucket, databaseURL });
      const testDb = admin.firestore();
      await testDb.collection('metadata').doc('system').get();
      console.log('Firebase Admin SDK initialized using Project ID fallback (no service account).');
      mode = 'admin';
    } catch (fallbackErr) {
      // If API key is present, switch to client SDK proxy for local development
      if (process.env.FIREBASE_API_KEY) {
        console.log('🔥 Firebase Web API Key detected. Using Local In-Memory Database for development.');
        mode = 'local';
      } else {
        console.warn('⚠️ Firebase credentials not configured. Falling back to local in‑memory database.');
        mode = 'local';
      }
    }
  }

  // Assign objects based on selected mode
  if (mode === 'admin') {
    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage();
    rtdb = admin.database();
  } else if (mode === 'proxy') {
    const { clientDb } = await import('./clientDb.js');
    db = clientDb;
    // Mock Auth, Storage, RTDB to keep interface stable
    const localVerifyIdToken = async (token) => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Firebase Auth unavailable in production mode without valid service account credentials');
      }
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.uid || payload.email)) {
            return payload;
          }
        }
      } catch (e) {
        // Ignore parsing errors and return fallback mock payload for local dev
      }
      return {
        uid: 'local_user_uid',
        email: 'citizen@rajcivic.com',
        role: 'Citizen',
        portal: 'citizen'
      };
    };

    auth = {
      verifyIdToken: localVerifyIdToken,
      createUser: async () => ({ uid: 'local_user' }),
      getUser: async () => null,
    };
    storage = { bucket: () => ({ file: () => ({}) }) };
    rtdb = { ref: () => ({ set: async () => {}, get: async () => ({ val: () => null }) }) };
  } else {
    const { localDb } = await import('./localDb.js');
    db = localDb;

    const localVerifyIdToken = async (token) => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Firebase Auth unavailable in production mode without valid service account credentials');
      }
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.uid || payload.email)) {
            return payload;
          }
        }
      } catch (e) {
        // Ignore parsing errors and return fallback mock payload for local dev
      }
      return {
        uid: 'local_user_uid',
        email: 'citizen@rajcivic.com',
        role: 'Citizen',
        portal: 'citizen'
      };
    };

    auth = {
      verifyIdToken: localVerifyIdToken,
      createUser: async () => ({ uid: 'local_user' }),
      getUser: async () => null,
    };
    storage = { bucket: () => ({ file: () => ({}) }) };
    rtdb = { ref: () => ({ set: async () => {}, get: async () => ({ val: () => null }) }) };
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  console.warn('⚠️ Falling back to local in‑memory database due to initialization failure.');
  const { localDb } = await import('./localDb.js');
  db = localDb;

  const localVerifyIdToken = async (token) => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Firebase Auth unavailable in production mode without valid service account credentials');
    }
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload && (payload.uid || payload.email)) {
          return payload;
        }
      }
    } catch (e) {
      // Ignore parsing errors and return fallback mock payload for local dev
    }
    return {
      uid: 'local_user_uid',
      email: 'citizen@rajcivic.com',
      role: 'Citizen',
      portal: 'citizen'
    };
  };

  auth = {
    verifyIdToken: localVerifyIdToken,
    createUser: async () => ({ uid: 'local_user' }),
    getUser: async () => null,
  };
  storage = { bucket: () => ({ file: () => ({}) }) };
  rtdb = { ref: () => ({ set: async () => {}, get: async () => ({ val: () => null }) }) };
  mode = 'local';
}

logMode();

export { db, auth, storage, rtdb, admin, mode };
export default app;
