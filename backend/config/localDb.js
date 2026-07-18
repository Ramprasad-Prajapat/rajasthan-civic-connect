import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, 'localDb.json');

/**
 * Local in-memory database fallback for when Firebase credentials are unavailable.
 * Implements the same interface as Firestore (doc, collection, get, set, update, where, etc.)
 * Pre-seeds with the same mock data as seedFirestore.js.
 */

// In-memory storage organized by collection name
const collections = {};

const saveToDisk = () => {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(collections, null, 2), 'utf8');
  } catch (err) {
    console.error("Error saving local database to disk:", err);
  }
};

// ── Pre-seeded data (matches seedFirestore.js) ──
const seedData = {
  users: {
    'citizen@rajcivic_com': {
      uid: 'citizen@rajcivic.com',
      email: 'citizen@rajcivic.com',
      name: 'Citizen User',
      fullName: 'Citizen User',
      displayName: 'Citizen User',
      phone: '9829088721',
      phoneNumber: '9829088721',
      role: 'Citizen',
      portal: 'citizen',
      ward: 'Ward No. 12',
      ulb: 'Jaipur Greater Municipal Corporation',
      status: 'Active',
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      password: 'citizen123'
    },
    'citizen@rajasthan_in': {
      uid: 'citizen@rajasthan.in',
      email: 'citizen@rajasthan.in',
      name: 'Ram Prasad',
      fullName: 'Ram Prasad',
      displayName: 'Ram Prasad',
      phone: '+91 98290 88721',
      phoneNumber: '+91 98290 88721',
      role: 'Citizen',
      portal: 'citizen',
      ward: 'Ward No. 12',
      ulb: 'Jaipur Greater Municipal Corporation',
      status: 'Active',
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      password: 'citizen123'
    },
    'worker@rajasthan_in': {
      uid: 'worker@rajasthan.in',
      email: 'worker@rajasthan.in',
      name: 'Rajesh Kumar',
      fullName: 'Rajesh Kumar',
      displayName: 'Rajesh Kumar',
      phone: '+91 98290 12345',
      phoneNumber: '+91 98290 12345',
      role: 'Worker',
      portal: 'worker',
      ward: 'Ward No. 12',
      ulb: 'Jaipur Greater Municipal Corporation',
      status: 'Active',
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      password: 'worker123'
    },
    'department@rajcivic_com': {
      uid: 'department@rajcivic.com',
      email: 'department@rajcivic.com',
      name: 'Department Officer',
      fullName: 'Department Officer',
      displayName: 'Department Officer',
      phone: '9829012345',
      phoneNumber: '9829012345',
      role: 'Department Officer',
      portal: 'department',
      ward: 'Ward No. 12',
      ulb: 'Jaipur Greater Municipal Corporation',
      status: 'Active',
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      password: 'dept123',
      empId: 'EMP-2026-X8',
      department: 'Urban Development'
    },
    'officer@rajasthan_in': {
      uid: 'officer@rajasthan.in',
      email: 'officer@rajasthan.in',
      name: 'Amit Kumar',
      fullName: 'Amit Kumar',
      displayName: 'Amit Kumar',
      phone: '+91 98290 54321',
      phoneNumber: '+91 98290 54321',
      role: 'Department Officer',
      portal: 'department',
      ward: 'Ward No. 12',
      ulb: 'Jaipur Greater Municipal Corporation',
      status: 'Active',
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      password: 'dept123'
    },
    'admin@rajcivic_com': {
      uid: 'admin@rajcivic.com',
      email: 'admin@rajcivic.com',
      name: 'Platform Super Administrator',
      fullName: 'Platform Super Administrator',
      displayName: 'Platform Super Administrator',
      phone: '9009009009',
      phoneNumber: '9009009009',
      role: 'Super Admin',
      portal: 'admin',
      ward: 'Ward No. 12',
      ulb: 'Jaipur Greater Municipal Corporation',
      status: 'Active',
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      password: 'admin123',
      authCode: '123456',
      adminId: 'ADM-ROOT-01',
      department: 'DLC HQ'
    }
  },
  complaints: {
    'RJC-2026-1001': {
      id: 'RJC-2026-1001',
      citizenId: 'citizen@rajasthan.in',
      citizenName: 'Ram Prasad',
      category: 'Garbage Dump',
      ward: 'Ward No. 12',
      department: 'Sanitation Department',
      status: 'Submitted',
      priority: 'High',
      isEmergency: false,
      title: 'Overflowing Garbage Container',
      description: 'The garbage container near community center is overflowing, causing bad smell.',
      remarks: '',
      rating: 0,
      feedback: '',
      photo: '',
      beforeProof: '',
      afterProof: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    'RJC-2026-1002': {
      id: 'RJC-2026-1002',
      citizenId: 'citizen@rajasthan.in',
      citizenName: 'Ram Prasad',
      category: 'Street Light',
      ward: 'Ward No. 12',
      department: 'Electrical Department',
      status: 'InProgress',
      priority: 'Medium',
      isEmergency: false,
      title: 'Street lights not working',
      description: 'Entire street light line in Block B is down for past 3 days.',
      remarks: 'Assigned to team 4.',
      rating: 0,
      feedback: '',
      photo: '',
      beforeProof: '',
      afterProof: '',
      assignedWorker: {
        name: 'Rajesh Kumar',
        phone: '+91 98290 12345'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  emergencies: {
    'EMG-JOD-NNJ-2026-1001': {
      emergencyId: 'EMG-JOD-NNJ-2026-1001',
      category: 'electricity',
      subtype: 'Transformer sparking',
      gps: 'Latitude: 26.9124° N, Longitude: 75.7873° E (Jaipur Central Office)',
      landmark: 'Opposite BSNL Tower',
      description: 'Major sparking at B-Block Transformer.',
      priority: 'Critical',
      sla: '1 hour',
      department: 'Electrical Department',
      status: 'Accepted',
      officerHandshake: 'Accepted',
      invalidReason: '',
      trustScore: 98,
      beforeProof: '',
      reporter: {
        uid: 'citizen@rajasthan.in',
        name: 'Ram Prasad',
        phone: '+91 98290 88721',
        email: 'citizen@rajasthan.in',
        role: 'Verified Citizen'
      },
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  reports: {
    'REP-1717329232': {
      reportId: 'REP-1717329232',
      reportType: 'complaint_summary',
      district: 'Jaipur',
      sambhag: 'Jaipur Division',
      month: 'June 2026',
      exportType: 'xlsx',
      totalComplaintsCount: 254,
      complianceRate: '96.4%',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  },
  feedback: {
    'FB-RJC-2026-1001-1717329232': {
      feedbackId: 'FB-RJC-2026-1001-1717329232',
      complaintId: 'RJC-2026-1001',
      rating: 5,
      comment: 'Quick resolution, clean work!',
      citizenId: 'citizen@rajasthan.in',
      createdAt: new Date().toISOString()
    }
  },
  metadata: {
    system: { seeded: true, timestamp: new Date().toISOString() }
  },
  notifications: {},
  departments: {},
  workers: {}
};

// Load from disk if available, otherwise initialize with seedData
const loadFromDisk = () => {
  try {
    if (fs.existsSync(dbFilePath)) {
      const fileData = fs.readFileSync(dbFilePath, 'utf8');
      const loaded = JSON.parse(fileData);
      for (const [colName, docs] of Object.entries(loaded)) {
        collections[colName] = { ...docs };
      }
      console.log("📦 Local database loaded from disk persistence.");
    } else {
      for (const [colName, docs] of Object.entries(seedData)) {
        collections[colName] = { ...docs };
      }
      saveToDisk();
      console.log("📦 Local database initialized with seed data and saved to disk.");
    }
  } catch (err) {
    console.error("Error loading local database from disk, using seed data fallback:", err);
    for (const [colName, docs] of Object.entries(seedData)) {
      collections[colName] = { ...docs };
    }
  }
};
loadFromDisk();

/**
 * Simulates a Firestore document snapshot.
 */
class LocalDocSnapshot {
  constructor(id, data) {
    this._id = id;
    this._data = data || null;
  }
  get id() { return this._id; }
  get exists() { return this._data !== null && this._data !== undefined; }
  data() { return this._data ? { ...this._data } : undefined; }
  get ref() {
    const self = this;
    return {
      id: self._id,
      update: async (updateData) => {
        if (self._data) {
          Object.assign(self._data, updateData);
          // Also update the source collection
          const colName = self._collectionName;
          if (colName && collections[colName]) {
            collections[colName][self._id] = { ...self._data };
            saveToDisk();
          }
        }
      },
      set: async (data, opts) => {
        if (opts && opts.merge && self._data) {
          Object.assign(self._data, data);
        } else {
          self._data = { ...data };
        }
        const colName = self._collectionName;
        if (colName && collections[colName]) {
          collections[colName][self._id] = { ...self._data };
          saveToDisk();
        }
      }
    };
  }
}

/**
 * Simulates a Firestore query snapshot.
 */
class LocalQuerySnapshot {
  constructor(docs) {
    this._docs = docs || [];
  }
  get empty() { return this._docs.length === 0; }
  get docs() { return this._docs; }
  get size() { return this._docs.length; }
  forEach(callback) { this._docs.forEach(callback); }
}

/**
 * Simulates a Firestore document reference.
 */
class LocalDocRef {
  constructor(collectionName, docId) {
    this._collectionName = collectionName;
    this._docId = docId;
  }

  /**
   * Support subcollections: doc(id).collection('timeline')
   * Stores as a flat collection with composite name like 'complaints/RJC-2026-1001/timeline'
   */
  collection(subCollectionName) {
    const compositeKey = `${this._collectionName}/${this._docId}/${subCollectionName}`;
    return new LocalCollectionRef(compositeKey);
  }

  async get() {
    if (!collections[this._collectionName]) {
      collections[this._collectionName] = {};
    }
    const data = collections[this._collectionName][this._docId] || null;
    const snap = new LocalDocSnapshot(this._docId, data);
    snap._collectionName = this._collectionName;
    return snap;
  }

  async set(data, options) {
    if (!collections[this._collectionName]) {
      collections[this._collectionName] = {};
    }
    if (options && options.merge) {
      const existing = collections[this._collectionName][this._docId] || {};
      collections[this._collectionName][this._docId] = { ...existing, ...data };
    } else {
      collections[this._collectionName][this._docId] = { ...data };
    }
    saveToDisk();
  }

  async update(data) {
    if (!collections[this._collectionName]) {
      collections[this._collectionName] = {};
    }
    const existing = collections[this._collectionName][this._docId] || {};
    collections[this._collectionName][this._docId] = { ...existing, ...data };
    saveToDisk();
  }

  async delete() {
    if (collections[this._collectionName]) {
      delete collections[this._collectionName][this._docId];
      saveToDisk();
    }
  }
}

/**
 * Simulates a Firestore query with chained where() and orderBy().
 */
class LocalQuery {
  constructor(collectionName, filters = []) {
    this._collectionName = collectionName;
    this._filters = filters;
  }

  where(field, op, value) {
    return new LocalQuery(this._collectionName, [...this._filters, { field, op, value }]);
  }

  orderBy() {
    // No-op for local DB, returns same query
    return this;
  }

  limit() {
    return this;
  }

  async get() {
    if (!collections[this._collectionName]) {
      collections[this._collectionName] = {};
    }
    const allDocs = Object.entries(collections[this._collectionName]);
    const filtered = allDocs.filter(([id, data]) => {
      return this._filters.every(({ field, op, value }) => {
        const fieldValue = data[field];
        switch (op) {
          case '==': return fieldValue === value;
          case '!=': return fieldValue !== value;
          case '>': return fieldValue > value;
          case '>=': return fieldValue >= value;
          case '<': return fieldValue < value;
          case '<=': return fieldValue <= value;
          case 'in': return Array.isArray(value) && value.includes(fieldValue);
          case 'array-contains': return Array.isArray(fieldValue) && fieldValue.includes(value);
          default: return true;
        }
      });
    });

    const docs = filtered.map(([id, data]) => {
      const snap = new LocalDocSnapshot(id, data);
      snap._collectionName = this._collectionName;
      return snap;
    });

    return new LocalQuerySnapshot(docs);
  }
}

/**
 * Simulates a Firestore collection reference.
 */
class LocalCollectionRef {
  constructor(collectionName) {
    this._collectionName = collectionName;
  }

  doc(docId) {
    return new LocalDocRef(this._collectionName, docId);
  }

  where(field, op, value) {
    return new LocalQuery(this._collectionName, [{ field, op, value }]);
  }

  orderBy() {
    return new LocalQuery(this._collectionName, []);
  }

  limit() {
    return new LocalQuery(this._collectionName, []);
  }

  async get() {
    if (!collections[this._collectionName]) {
      collections[this._collectionName] = {};
    }
    const allDocs = Object.entries(collections[this._collectionName]);
    const docs = allDocs.map(([id, data]) => {
      const snap = new LocalDocSnapshot(id, data);
      snap._collectionName = this._collectionName;
      return snap;
    });
    return new LocalQuerySnapshot(docs);
  }

  async add(data) {
    if (!collections[this._collectionName]) {
      collections[this._collectionName] = {};
    }
    const id = `AUTO_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    collections[this._collectionName][id] = { ...data };
    saveToDisk();
    return new LocalDocRef(this._collectionName, id);
  }
}

/**
 * The local database object - mimics admin.firestore() interface.
 */
const localDb = {
  collection(name) {
    return new LocalCollectionRef(name);
  }
};

console.log("📦 Local in-memory database initialized with seeded data.");
console.log(`   Collections: ${Object.keys(collections).join(', ')}`);
console.log(`   Users seeded: ${Object.keys(collections.users || {}).length}`);

export default localDb;
export { localDb, collections };
