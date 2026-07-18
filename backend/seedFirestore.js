import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// 1. Read .env file to get Firebase Credentials
let envContent = '';
const pathsToTry = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'frontend', '.env'),
  resolve(process.cwd(), '../frontend', '.env'),
  resolve(import.meta.dirname, '../frontend/.env')
];

for (const p of pathsToTry) {
  try {
    const content = readFileSync(p, 'utf8');
    if (content.includes('VITE_FIREBASE_API_KEY')) {
      envContent = content;
      console.log("Successfully loaded .env from:", p);
      break;
    }
  } catch (err) {
    // Keep trying
  }
}

if (!envContent) {
  console.error("Could not find .env file in any search path.");
  process.exit(1);
}

// Simple parsing helper
const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, 'm'));
  return match ? match[1].trim().replace(/['"]/g, '') : '';
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL')
};

console.log("Initializing Firebase with Project ID:", firebaseConfig.projectId);

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
  console.error("Firebase config is not valid. Check your .env file.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock data to seed
const mockUsers = [
  {
    uid: "citizen@rajasthan.in",
    email: "citizen@rajasthan.in",
    name: "Ram Prasad",
    fullName: "Ram Prasad",
    displayName: "Ram Prasad",
    phone: "+91 98290 88721",
    phoneNumber: "+91 98290 88721",
    role: "Citizen",
    portal: "citizen",
    ward: "Ward No. 12",
    ulb: "Jaipur Greater Municipal Corporation",
    status: "Active",
    photoURL: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: "citizen123"
  },
  {
    uid: "citizen@rajcivic.com",
    email: "citizen@rajcivic.com",
    name: "Citizen User",
    fullName: "Citizen User",
    displayName: "Citizen User",
    phone: "9829088721",
    phoneNumber: "9829088721",
    role: "Citizen",
    portal: "citizen",
    ward: "Ward No. 12",
    ulb: "Jaipur Greater Municipal Corporation",
    status: "Active",
    photoURL: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: "citizen123"
  },
  {
    uid: "worker@rajasthan.in",
    email: "worker@rajasthan.in",
    name: "Rajesh Kumar",
    fullName: "Rajesh Kumar",
    displayName: "Rajesh Kumar",
    phone: "+91 98290 12345",
    phoneNumber: "+91 98290 12345",
    role: "Worker",
    portal: "worker",
    ward: "Ward No. 12",
    ulb: "Jaipur Greater Municipal Corporation",
    status: "Active",
    photoURL: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: "worker123"
  },
  {
    uid: "officer@rajasthan.in",
    email: "officer@rajasthan.in",
    name: "Amit Kumar",
    fullName: "Amit Kumar",
    displayName: "Amit Kumar",
    phone: "+91 98290 54321",
    phoneNumber: "+91 98290 54321",
    role: "Department Officer",
    portal: "department",
    ward: "Ward No. 12",
    ulb: "Jaipur Greater Municipal Corporation",
    status: "Active",
    photoURL: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: "dept123"
  },
  {
    uid: "department@rajcivic.com",
    email: "department@rajcivic.com",
    name: "Department Officer",
    fullName: "Department Officer",
    displayName: "Department Officer",
    phone: "9829012345",
    phoneNumber: "9829012345",
    role: "Department Officer",
    portal: "department",
    ward: "Ward No. 12",
    ulb: "Jaipur Greater Municipal Corporation",
    status: "Active",
    photoURL: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: "dept123",
    empId: "EMP-2026-X8",
    department: "Urban Development"
  },
  {
    uid: "admin@rajcivic.com",
    email: "admin@rajcivic.com",
    name: "Platform Super Administrator",
    fullName: "Platform Super Administrator",
    displayName: "Platform Super Administrator",
    phone: "9009009009",
    phoneNumber: "9009009009",
    role: "Super Admin",
    portal: "admin",
    ward: "Ward No. 12",
    ulb: "Jaipur Greater Municipal Corporation",
    status: "Active",
    photoURL: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: "admin123",
    authCode: "123456",
    adminId: "ADM-ROOT-01",
    department: "DLC HQ"
  }
];

const mockComplaints = [
  {
    id: "RJC-2026-1001",
    citizenId: "citizen@rajasthan.in",
    citizenName: "Ram Prasad",
    category: "Garbage Dump",
    ward: "Ward No. 12",
    department: "Sanitation Department",
    status: "Submitted",
    priority: "High",
    isEmergency: false,
    title: "Overflowing Garbage Container",
    description: "The garbage container near community center is overflowing, causing bad smell.",
    remarks: "",
    rating: 0,
    feedback: "",
    photo: "",
    beforeProof: "",
    afterProof: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "RJC-2026-1002",
    citizenId: "citizen@rajasthan.in",
    citizenName: "Ram Prasad",
    category: "Street Light",
    ward: "Ward No. 12",
    department: "Electrical Department",
    status: "InProgress",
    priority: "Medium",
    isEmergency: false,
    title: "Street lights not working",
    description: "Entire street light line in Block B is down for past 3 days.",
    remarks: "Assigned to team 4.",
    rating: 0,
    feedback: "",
    photo: "",
    beforeProof: "",
    afterProof: "",
    assignedWorker: {
      name: "Rajesh Kumar",
      phone: "+91 98290 12345"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockEmergencies = [
  {
    emergencyId: "EMG-JOD-NNJ-2026-1001",
    category: "electricity",
    subtype: "Transformer sparking",
    gps: "Latitude: 26.9124° N, Longitude: 75.7873° E (Jaipur Central Office)",
    landmark: "Opposite BSNL Tower",
    description: "Major sparking at B-Block Transformer.",
    priority: "Critical",
    sla: "1 hour",
    department: "Electrical Department",
    status: "Accepted",
    officerHandshake: "Accepted",
    invalidReason: "",
    trustScore: 98,
    beforeProof: "",
    reporter: {
      uid: "citizen@rajasthan.in",
      name: "Ram Prasad",
      phone: "+91 98290 88721",
      email: "citizen@rajasthan.in",
      role: "Verified Citizen"
    },
    timestamp: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockReports = [
  {
    reportId: "REP-1717329232",
    reportType: "complaint_summary",
    district: "Jaipur",
    sambhag: "Jaipur Division",
    month: "June 2026",
    exportType: "xlsx",
    totalComplaintsCount: 254,
    complianceRate: "96.4%",
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

const mockFeedback = [
  {
    feedbackId: "FB-RJC-2026-1001-1717329232",
    complaintId: "RJC-2026-1001",
    rating: 5,
    comment: "Quick resolution, clean work!",
    citizenId: "citizen@rajasthan.in",
    createdAt: new Date().toISOString()
  }
];

async function seed() {
  try {
    console.log("Seeding users...");
    for (const user of mockUsers) {
      await setDoc(doc(db, "users", user.uid), user);
    }

    console.log("Seeding complaints...");
    for (const complaint of mockComplaints) {
      await setDoc(doc(db, "complaints", complaint.id), complaint);
    }

    console.log("Seeding emergencies...");
    for (const emergency of mockEmergencies) {
      await setDoc(doc(db, "emergencies", emergency.emergencyId), emergency);
    }

    console.log("Seeding reports...");
    for (const report of mockReports) {
      await setDoc(doc(db, "reports", report.reportId), report);
    }

    console.log("Seeding feedback...");
    for (const fb of mockFeedback) {
      await setDoc(doc(db, "feedback", fb.feedbackId), fb);
    }

    // Set metadata flag
    await setDoc(doc(db, "metadata", "system"), { seeded: true, timestamp: new Date().toISOString() });

    console.log("🎉 Firestore database successfully seeded!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

seed();
