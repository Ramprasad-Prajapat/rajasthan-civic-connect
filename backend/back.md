# RajCivic Connect – Firebase Firestore Database Architecture & Complete Backend Integration

This document details the database integration, complete collection structures, subcollections, document schemas, component integration workflows, and initialization procedures implemented across the application.

---

## 1. Directory Structure

All backend-related modules are organized in the following locations:

```text
Internship_Project/Rajasthan/
├── backend/
│   ├── package.json          # Node configuration for running standalone backend scripts
│   ├── seedFirestore.js      # CLI Database Seeding Script
│   └── back.md               # [THIS FILE] Complete database and integration documentation
└── frontend/
    ├── .env                  # Firebase configuration keys
    └── src/
        ├── firebase.js       # Firebase SDK Initialization
        ├── firestoreService.js # Unified database CRUD and storage upload library
        ├── App.jsx           # Mounts and runs the startup seeding hook
        └── components/       # All UI components connected to firestoreService
```

---

## 2. Firestore Collection Specifications

The application uses Firestore as its primary document-based transactional store, with secondary file uploads routed to Firebase Storage and metadata notifications mirrored to Firebase Realtime Database (RTDB).

### 2.1 `users` Collection
Stores details for citizens, field workers, and department/super officers.
* **Document ID**: `uid` (Firebase Authentication User UID / User Email fallback)
* **Document Schema**:
```json
{
  "uid": "string",
  "email": "string",
  "name": "string",
  "fullName": "string",
  "displayName": "string",
  "phone": "string",
  "phoneNumber": "string",
  "role": "Citizen | Worker | Department Officer | Super Admin",
  "portal": "citizen | worker | department | admin",
  "ward": "string",
  "ulb": "string",
  "status": "Active | Suspended",
  "photoURL": "string (Storage/DataUrl download link)",
  "createdAt": "ISO 8601 string",
  "updatedAt": "ISO 8601 string"
}
```

---

### 2.2 `complaints` Collection
Main grievance ledger detailing category routing, GIS ward parameters, assignees, and active SLA countdowns.
* **Document ID**: Unique ticket ID (e.g. `RJC-2026-XXXX` or `RJCIVIC-JAI-NNJ-2026-XXXX`)
* **Document Schema**:
```json
{
  "id": "string",
  "userId": "string (UID of creator)",
  "citizenId": "string",
  "citizenName": "string",
  "category": "string (e.g. Garbage Collection, Water Leakage)",
  "ward": "string (e.g. Ward No. 12)",
  "department": "string",
  "status": "Submitted | Assigned | InProgress | Resolved | Closed | Reopened | SLA Delayed",
  "priority": "Medium | High | Critical",
  "isEmergency": "boolean",
  "title": "string",
  "description": "string",
  "remarks": "string",
  "rating": "number (0-5)",
  "feedback": "string",
  "photo": "string (visual proof URL)",
  "beforeProof": "string (original photo URL)",
  "afterProof": "string (resolution proof photo URL)",
  "assignedWorker": {
    "name": "string",
    "phone": "string"
  },
  "createdAt": "ISO 8601 string",
  "updatedAt": "ISO 8601 string",
  "timeline": "array of timelineEvent objects"
}
```

#### Subcollection: `complaintTimeline`
Logs structural audit trails for status transitions.
* **Document ID**: Custom stage key (e.g. `Submitted`, `InProgress_178239023`)
* **Subdocument Schema**:
```json
{
  "status": "string (e.g. Assigned)",
  "title": "string",
  "description": "string (e.g. Assigned to Rajesh Kumar)",
  "timestamp": "ISO 8601 string",
  "updatedBy": "string (Reporter / Nodal Officer / Field Executive)"
}
```

---

### 2.3 `emergencies` Collection
For rapid response coordinates, high-level priority dispatching, and automated municipal officer handshakes.
* **Document ID**: Unique emergency ID (e.g. `EMG-JOD-NNJ-2026-XXXX`)
* **Document Schema**:
```json
{
  "emergencyId": "string",
  "category": "string",
  "subtype": "string",
  "gps": "string (coordinates)",
  "landmark": "string",
  "description": "string",
  "priority": "Critical | High",
  "sla": "string (e.g. 1 hour, 2 hours)",
  "department": "string",
  "status": "Assigned | Accepted | Escalated | Invalid",
  "officerHandshake": "string (Accepted | Escalated | Invalid)",
  "invalidReason": "string (if marked invalid)",
  "trustScore": "number",
  "beforeProof": "string (photo URL)",
  "reporter": {
    "uid": "string",
    "name": "string",
    "phone": "string",
    "email": "string",
    "role": "string"
  },
  "timestamp": "string (locale time)",
  "date": "string (locale date)",
  "createdAt": "ISO 8601 string",
  "updatedAt": "ISO 8601 string"
}
```

---

### 2.4 `feedback` Collection
Deep-dive rating indicators and service logs captured from citizen desk reviews.
* **Document ID**: `FB-RJC-2026-XXXX-Timestamp`
* **Document Schema**:
```json
{
  "feedbackId": "string",
  "complaintId": "string",
  "rating": "number (1-5)",
  "comment": "string",
  "citizenId": "string",
  "createdAt": "ISO 8601 string"
}
```

---

### 2.5 `reports` Collection
Metadata tracking logs for digitally signed files exported from the reports center.
* **Document ID**: `REP-Timestamp`
* **Document Schema**:
```json
{
  "reportId": "string",
  "reportType": "string (e.g. complaint_summary, sla_delay)",
  "district": "string",
  "sambhag": "string",
  "month": "string",
  "exportType": "xlsx | txt | pdf",
  "totalComplaintsCount": "number",
  "complianceRate": "string (e.g. 96.4%)",
  "timestamp": "ISO 8601 string",
  "createdAt": "ISO 8601 string"
}
```

---

## 3. Component Integration Matrix

All interaction scripts have been wired to the unified backend service helper library: `src/firestoreService.js`.

### 3.1 App Core (`App.jsx`)
* **Auth Observer**: Dynamically syncs local storage session context with matching records inside the `users` Firestore collection.
* **Auto-Seeding**: Runs a mounting hook checks if the system metadata exists; if not, it automatically runs `seedFirestoreOnStartup()` to initialize all 5 collections.

### 3.2 Authentication (`LoginRegister.jsx`)
* **Registration Sync**: Invokes `saveUserProfile` when registering a new citizen, worker, or officer account using Firebase Auth or mock forms, ensuring correct role badges and jurisdiction tags exist.

### 3.3 Complaint Center (`ComplaintCenter.jsx` & `MyComplaints.jsx`)
* **Complaint Lodging**: Compiles form values (GIS Coordinates, ULBs, categories) and routes attachments to Firebase Storage before creating documents in `complaints` and `complaintTimeline`.
* **Grievance Tracking**: Queries Firestore dynamically to construct interactive timelines, showing current status, assignee, and SLA warnings.
* **Citizen Feedback & Reopening**: Handles star-rating submissions to `feedback` collection and marks complaints status as `Closed`. Reopens resolved complaints to `Reopened` with fresh proof photos.

### 3.4 Work Management (`DashboardPreview.jsx`)
* **Dashboard Live Queries**: Automatically loads complaints according to the authenticated user's role:
  - *Citizen*: Filters by `citizenId`
  - *Worker*: Filters by `assignedWorker.name`
  - *Officer / Super Admin*: Scans division/district scope
* **Officer Assignments**: Allows officers to assign workers to complaints, updating status to `Assigned`.
* **Worker Resolutions**: Allows field workers to log resolution proofs and transition status to `Resolved`.

### 3.5 Profile Settings (`ProfilePreview.jsx`)
* **Details Sync**: Fetches and edits full name, phone number, ward, and municipal local bodies. Uploads new profile pictures to `users/${uid}/avatar.jpg` and updates `photoURL` in the Firestore user document.

### 3.6 Emergency Dispatches (`EmergencyHelp.jsx`)
* **Emergency Lodging**: Creates entries in the `emergencies` collection inside both Firestore and Realtime Database.
* **Officer Handshakes**: Commits status updates (`Accepted`, `Escalated`, `Invalid`) to update state handshakes and logs penalties to citizen trust scores.

### 3.7 Reports Desk (`ReportsCenter.jsx`)
* **Metrics Assembly**: Queries live Firestore complaints to build monthly statistics and highlighted calendar days.
* **Export Logs**: Automatically calls `saveReport` when Excel or TXT files are downloaded to log the report type, month, scope, and total metrics.

---

## 4. Database Seeding & Setup

A standalone seeding workflow has been established in the `backend` directory to initialize collections and insert mock reference data.

### 4.1 CLI Execution
To trigger manual database seeding, navigate to the `backend` directory and run:
```bash
cd backend
npm install
node seedFirestore.js
```
This reads your project configuration from `frontend/.env`, initializes Firebase, and seeds default mock documents into the `users`, `complaints`, `emergencies`, `reports`, and `feedback` collections.

### 4.2 Auto-Seeding Trigger
On application startup, `App.jsx` automatically checks if the database contains system metadata. If empty, the app seeds all collections automatically via the client.
