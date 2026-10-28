# API Contract: Rajasthan Civic Connect (Spring Boot 3 + MySQL)

## 1. Authentication & Security
- **Header:** `Authorization: Bearer <token>`
- **Token Type:** HS256 JWT, signed with `app.jwt.secret`.
- **Role Source of Truth:** MySQL database `users.role` (never client payload or request).
- **Public Endpoints (Permitted without token):**
  - `OPTIONS /**`
  - `GET /health`, `GET /api/health`
  - `GET /api/departments`, `GET /departments`
  - `GET /api/reports/summary`, `GET /reports/summary`
  - `POST /api/emergencies`, `POST /emergencies` (Public SOS submission)
  - `POST /api/auth/register`, `POST /auth/register`
  - `POST /api/auth/login`, `POST /auth/login`
  - `POST /api/auth/sync-user`, `POST /auth/sync-user` (501 Not Implemented)
  - `POST /api/auth/forgot-password-verify`, `POST /auth/forgot-password-verify` (501 Not Implemented)
  - `POST /api/auth/reset-password`, `POST /auth/reset-password` (501 Not Implemented)
- **Protected Staff Endpoints:**
  - `PUT /api/complaints/{id}/status` (Roles: `ADMIN`, `SUPER ADMIN`, `DEPARTMENT OFFICER`, `OFFICER`)
  - `PUT /api/complaints/{id}/assign-worker` (Roles: `ADMIN`, `OFFICER`)
  - `GET /api/audit-logs` (Roles: `ADMIN`, `OFFICER`)
  - `GET /api/reports/complaints`, `GET /api/reports/export/**`
- **All other endpoints:** Authenticated (requires valid JWT token).

---

## 2. Common Error Response Shape
HTTP Statuses: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`, `501 Not Implemented`
```json
{
  "success": false,
  "error": "Error description",
  "message": "Error description"
}
```

---

## 3. Endpoints Inventory & Classification

| Method | Endpoint | Classification | Persistence / Computation | Description & Envelope |
|---|---|---|---|---|
| GET | `/api/health` | CORE | Computed | Service health status `{ "status": "healthy", "timestamp": "...", "environment": "production" }` |
| POST | `/api/auth/register` | CORE | Persisted (`users`) | Citizen registration. Role forced to `Citizen`. Password BCrypt hashed. Returns 201: `{ "message": "Registration successful", "token": "...", "user": { ... } }` |
| POST | `/api/auth/login` | CORE | Persisted (`users`) | Citizen/Staff login. Returns 200: `{ "message": "Login successful", "token": "...", "user": { "id": "1", "uid": "1", "email": "...", "name": "...", "role": "...", "portal": "...", "status": "Active" } }` |
| GET | `/api/auth/me` | CORE | Persisted (`users`) | Current user profile from token subject. Returns 200: `{ "id": "1", "uid": "1", "email": "...", "name": "...", "role": "..." }` |
| GET | `/api/users/{id}` | CORE | Persisted (`users`) | User profile inspection. Self or Staff only. Returns 200: `{ "id": "...", "email": "...", "name": "...", "role": "..." }` |
| GET | `/api/users` | ADMIN | Persisted (`users`) | Staff listing of registered users. Returns 200: `[ { "id": "...", "name": "...", "email": "...", "role": "..." } ]` |
| PUT | `/api/users/{id}` | ADMIN | Persisted (`users`) | Update user profile/role. Returns 200: `{ "id": "...", "name": "...", "phone": "..." }` |
| DELETE | `/api/users/{id}` | ADMIN | Persisted (`users`) | Delete user record. Returns 200: `{ "message": "User deleted successfully" }` |
| POST | `/api/complaints` | CORE | Persisted (`complaints`, `complaint_timeline`, `complaint_media`, `notifications`, `audit_logs`) | Lodges civic ticket with SLA deadline and auto-routed department. Clears citizen draft. Returns 201: complaint object with `id`, `complaintId`, `timeline` |
| GET | `/api/complaints` | CORE | Persisted (`complaints`) | List complaints. Staff see all; citizens see own tickets. Returns 200: `[ { "id": "...", "complaintId": "...", ... } ]` |
| GET | `/api/complaints/my` | CORE | Persisted (`complaints`) | Citizen's own grievances. Returns 200: `[ { "id": "...", "complaintId": "...", ... } ]` |
| GET | `/api/complaints/{idOrCode}` | CORE | Persisted (`complaints`, `complaint_timeline`, `complaint_media`) | Full grievance ticket detail with chronological timeline and before/after photos. Returns 200: `{ "complaintId": "...", "timeline": [ ... ], "beforePhotos": [ ... ] }` |
| PUT | `/api/complaints/{idOrCode}/status` | CORE | Persisted (`complaints`, `complaint_timeline`, `audit_logs`) | Update status (`InProgress`, `Resolved`, `Closed`). Closed tickets return 409 Conflict if modified. Returns 200: `{ "complaintId": "...", "status": "..." }` |
| PUT | `/api/complaints/{idOrCode}/assign-worker` | CORE | Persisted (`complaints`, `complaint_timeline`, `notifications`, `audit_logs`) | Assigns field executive to ticket. Returns 200: `{ "message": "Worker assigned successfully", "status": "Assigned" }` |
| PUT | `/api/complaints/{idOrCode}/reopen` | CORE | Persisted (`complaints`, `complaint_timeline`, `complaint_media`, `audit_logs`) | Reopens closed/resolved grievance with citizen feedback and optional photo. Returns 200: `{ "message": "Grievance successfully reopened.", "status": "Reopened" }` |
| DELETE | `/api/complaints/{idOrCode}` | CORE | Persisted (`complaints`, `complaint_media`) | Removes grievance ticket and associated media. Returns 200: `{ "message": "Complaint deleted successfully" }` |
| POST | `/api/complaints/draft` | FEATURE | Persisted (`complaint_drafts`) | Saves grievance draft in MySQL per user. Returns 200: `{ "message": "Draft saved successfully", "draft": { ... } }` |
| GET | `/api/complaints/draft` | FEATURE | Persisted (`complaint_drafts`) | Retrieves saved draft for current user. Returns 200: `{ "draft": { ... } }` |
| DELETE | `/api/complaints/draft` | FEATURE | Persisted (`complaint_drafts`) | Removes saved draft. Returns 200: `{ "message": "Draft deleted successfully" }` |
| GET | `/api/departments` | FEATURE | Persisted (`departments`) | Lists municipal departments. Returns 200: `[ { "id": "sanitation", "deptId": "sanitation", "name": "Sanitation Department", "officer": "Amit Kumar" }, ... ]` |
| POST | `/api/departments` | FEATURE | Persisted (`departments`) | Creates new municipal department. Returns 201: `{ "id": 6, "name": "...", "officer": "..." }` |
| PUT | `/api/departments/{id}` | FEATURE | Persisted (`departments`) | Updates department officer/name/contact. Returns 200: `{ "id": 6, "name": "..." }` |
| DELETE | `/api/departments/{id}` | FEATURE | Persisted (`departments`) | Deletes department. Returns 200: `{ "message": "Department deleted successfully" }` |
| GET | `/api/emergencies` | FEATURE | Persisted (`emergencies`) | Lists emergency SOS incidents. Staff see all; citizens see own. Returns 200: `[ { "emergencyCode": "...", "type": "...", "status": "..." } ]` |
| POST | `/api/emergencies` | FEATURE | Persisted (`emergencies`) | Public SOS alert lodging with GPS coordinates and optional guest reporter details. Returns 201: `{ "success": true, "data": { ... } }` |
| PUT | `/api/emergencies/{id}/status` | FEATURE | Persisted (`emergencies`) | Officer updates emergency status (`Dispatching`, `Resolved`, `Invalid`). Returns 200: updated emergency entity |
| POST | `/api/feedback` | FEATURE | Persisted (`feedback`) | Citizen rating and feedback for resolved complaint. Returns 200: `{ "id": 1, "complaintId": "...", "rating": 5, "comment": "..." }` |
| GET | `/api/feedback/{complaintId}` | FEATURE | Persisted (`feedback`) | Retrieves citizen satisfaction feedback for complaint. Returns 200: `[ { ... } ]` |
| GET | `/api/notifications` | FEATURE | Persisted (`notifications`) | Retrieves citizen/staff notifications. Returns 200: `[ { "id": 1, "title": "...", "message": "...", "isRead": false } ]` |
| PUT | `/api/notifications/{id}/read` | FEATURE | Persisted (`notifications`) | Marks notification as read. Returns 200: `{ "message": "Notification marked as read" }` |
| POST | `/api/notifications` | FEATURE | Persisted (`notifications`) | Triggers system/staff notification. Returns 200: `{ "success": true, "data": { ... } }` |
| GET | `/api/workers` | FEATURE | Persisted (`workers`) | Lists field executives. Returns 200: `[ { "id": 1, "name": "...", "status": "Active" } ]` |
| POST | `/api/workers` | FEATURE | Persisted (`workers`) | Enrolls new field worker. Returns 200: `{ "id": 5, "name": "...", "departmentName": "..." }` |
| GET | `/api/workers/{id}/tasks` | FEATURE | Computed | Lists tasks assigned to worker. Returns 200: `[]` |
| PUT | `/api/workers/{id}/status` | FEATURE | Persisted (`workers`) | Updates worker active/on-duty status. Returns 200: `{ "id": 1, "status": "Active" }` |
| PUT | `/api/workers/complaints/{id}/upload-proof` | FEATURE | Persisted (`complaint_media`) | Records resolution proof photo from field. Returns 200: `{ "message": "Proof recorded", "afterURL": "" }` |
| GET | `/api/dashboard/citizen` | ANALYTICS | Computed from MySQL | Aggregates citizen grievances: total, resolved, pending, reopened. Returns 200: `{ "total": 5, "resolved": 2, "pending": 3, "reopened": 0 }` |
| GET | `/api/dashboard/worker` | ANALYTICS | Computed from MySQL | Aggregates field work: total tickets, completed, pending. Returns 200: `{ "total": 10, "completed": 4, "pending": 6 }` |
| GET | `/api/dashboard/officer` | ANALYTICS | Computed from MySQL | Department SLA metrics, breaches, emergencies. Returns 200: `{ "total": 15, "resolved": 8, "slaBreaches": 1, "emergencyCases": 2 }` |
| GET | `/api/dashboard/admin` | ANALYTICS | Computed from MySQL | State-wide analytics: total users, complaints, departments, resolution rate, ward/district breakdown. Returns 200: `{ "totalUsers": 10, ... }` |
| GET | `/api/reports/summary` | ANALYTICS | Computed from MySQL | Public SLA compliance and resolution rate summary. Returns 200: `{ "total": 15, "resolved": 8, "complianceRate": "93.3%" }` |
| GET | `/api/reports/complaints` | ANALYTICS | Computed from MySQL | Detailed complaints table for reporting portal. Returns 200: `[ { "complaintId": "...", ... } ]` |
| GET | `/api/reports/export/excel` | ANALYTICS | Computed from MySQL | Generates live CSV export (`complaints_export.csv`) from MySQL database. Returns 200 with `text/csv` attachment |
| GET | `/api/reports/export/pdf` | ANALYTICS | Computed | Formats summary report for print. Returns 200: `{ "message": "PDF generation completed", "status": "ready" }` |
| GET | `/api/audit-logs` | AUDIT | Persisted (`audit_logs`) | Staff view of administrative audit log trail (last 100 entries). Returns 200: `{ "success": true, "data": [ ... ], "count": 12 }` |
| POST | `/api/audit-logs` | AUDIT | Persisted (`audit_logs`) | Client action audit event logging. Returns 201: `{ "success": true, "id": 14 }` |
| POST | `/api/ai/classify` | AI-SIMULATED | Mock by design | Keyword-based heuristic categorization & SLA prioritization. Returns 200: `{ "success": true, "category": "electrical", "priority": "Normal", "simulated": true }` |
| POST | `/api/ai/analyze-image` | AI-SIMULATED | Mock by design | Vision anomaly heuristic analysis. Returns 200: `{ "success": true, "data": { ... }, "simulated": true }` |
| GET | `/api/ai/analytics` | AI-SIMULATED | Mock by design | Machine learning compliance forecast. Returns 200: `{ "success": true, "data": { "slaComplianceForecast": "94.2%" }, "simulated": true }` |
| POST | `/api/auth/sync-user` | UNSUPPORTED | None | Returns 501: `{ "success": false, "error": "This sign-in method is not available in this version", "message": "This sign-in method is not available in this version" }` |
| POST | `/api/auth/forgot-password-verify` | UNSUPPORTED | None | Returns 501: `{ "success": false, "error": "This sign-in method is not available in this version", "message": "This sign-in method is not available in this version" }` |
| POST | `/api/auth/reset-password` | UNSUPPORTED | None | Returns 501: `{ "success": false, "error": "This sign-in method is not available in this version", "message": "This sign-in method is not available in this version" }` |
