import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  addDoc 
} from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDMHVb9RAXYLw9TyYUSAJSqnFa3bv-_tHY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "rajcivic-5a9c1.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "rajcivic-5a9c1",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "rajcivic-5a9c1.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1051316125972",
  appId: process.env.FIREBASE_APP_ID || "1:1051316125972:web:e9c0250b5f269ab9488201"
};

console.log("🔥 Initializing Firebase Client SDK Firestore proxy for real-time sync...");
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

class ClientDocSnapshot {
  constructor(id, dataExists, data, path) {
    this.id = id;
    this._exists = dataExists;
    this._data = data;
    this._path = path;
  }
  get exists() { return this._exists; }
  data() { return this._data; }
  get ref() {
    return new ClientDocRef(this._path);
  }
}

class ClientQuerySnapshot {
  constructor(docs) {
    this.docs = docs;
    this.size = docs.length;
    this.empty = docs.length === 0;
  }
  forEach(callback) {
    this.docs.forEach(callback);
  }
}

class ClientDocRef {
  constructor(path) {
    this.path = path;
  }
  
  collection(subCollectionName) {
    return new ClientCollectionRef(`${this.path}/${subCollectionName}`);
  }

  async get() {
    try {
      const docRef = doc(firestore, this.path);
      const snap = await getDoc(docRef);
      return new ClientDocSnapshot(snap.id, snap.exists(), snap.data(), this.path);
    } catch (err) {
      console.error(`Error in doc(${this.path}).get():`, err.message);
      throw err;
    }
  }

  async set(data, options) {
    try {
      const docRef = doc(firestore, this.path);
      if (options && options.merge) {
        await setDoc(docRef, data, { merge: true });
      } else {
        await setDoc(docRef, data);
      }
    } catch (err) {
      console.error(`Error in doc(${this.path}).set():`, err.message);
      throw err;
    }
  }

  async update(data) {
    try {
      const docRef = doc(firestore, this.path);
      await updateDoc(docRef, data);
    } catch (err) {
      console.error(`Error in doc(${this.path}).update():`, err.message);
      throw err;
    }
  }

  async delete() {
    try {
      const docRef = doc(firestore, this.path);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(`Error in doc(${this.path}).delete():`, err.message);
      throw err;
    }
  }
}

class ClientQuery {
  constructor(collectionPath, filters = []) {
    this.collectionPath = collectionPath;
    this.filters = filters;
  }

  where(field, op, value) {
    return new ClientQuery(this.collectionPath, [...this.filters, { field, op, value }]);
  }

  orderBy() {
    return this;
  }

  limit() {
    return this;
  }

  async get() {
    try {
      const colRef = collection(firestore, this.collectionPath);
      let q = colRef;
      if (this.filters.length > 0) {
        const constraints = this.filters.map(f => {
          return where(f.field, f.op, f.value);
        });
        q = query(colRef, ...constraints);
      }
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => new ClientDocSnapshot(d.id, true, d.data(), `${this.collectionPath}/${d.id}`));
      return new ClientQuerySnapshot(docs);
    } catch (err) {
      console.error(`Error in collection(${this.collectionPath}).query.get():`, err.message);
      throw err;
    }
  }
}

class ClientCollectionRef {
  constructor(path) {
    this.path = path;
  }

  doc(docId) {
    return new ClientDocRef(`${this.path}/${docId}`);
  }

  where(field, op, value) {
    return new ClientQuery(this.path, [{ field, op, value }]);
  }

  orderBy() {
    return new ClientQuery(this.path, []);
  }

  limit() {
    return new ClientQuery(this.path, []);
  }

  async get() {
    try {
      const colRef = collection(firestore, this.path);
      const snap = await getDocs(colRef);
      const docs = snap.docs.map(d => new ClientDocSnapshot(d.id, true, d.data(), `${this.path}/${d.id}`));
      return new ClientQuerySnapshot(docs);
    } catch (err) {
      console.error(`Error in collection(${this.path}).get():`, err.message);
      throw err;
    }
  }

  async add(data) {
    try {
      const colRef = collection(firestore, this.path);
      const docRef = await addDoc(colRef, data);
      return new ClientDocRef(`${this.path}/${docRef.id}`);
    } catch (err) {
      console.error(`Error in collection(${this.path}).add():`, err.message);
      throw err;
    }
  }
}

export const clientDb = {
  collection(name) {
    return new ClientCollectionRef(name);
  }
};

export default clientDb;
