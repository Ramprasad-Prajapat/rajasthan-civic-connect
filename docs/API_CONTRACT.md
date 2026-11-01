# API Contract: Rajasthan Civic Connect (Simplified Architecture)

## 1. Authentication & Security
- **Header:** `Authorization: Bearer <token>`
- **Token Type:** HS256 JWT, signed with `app.jwt.secret`.
- **Role Source of Truth:** MySQL database `users.role` (Citizen, Department Officer, Admin).
- **Disabled Users:** Any user with `active = false` is rejected at login with `403 Forbidden` (`Account is disabled`) and existing tokens are rejected with `403 Forbidden`.
- **Public Endpoints (No token required):**
  - `GET /api/health`
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/departments` (public listing)
- **Protected Endpoints:**
  - `GET /api/auth/me`, `PUT /api/auth/me`: Authenticated user profile
  - `PUT /api/auth/change-password`: Authenticated password change
  - `POST /api/complaints`: Citizen lodging ticket
  - `GET /api/complaints`, `GET /api/complaints/my`, `GET /api/complaints/{idOrCode}`: Scoped by role
  - `PUT /api/complaints/{id}/status`: Officer (own department only) or Admin
  - `PUT /api/complaints/{id}/department`: Admin only
  - `GET/POST/DELETE /api/complaints/draft`: Citizen draft management
  - `POST/PUT/DELETE /api/departments/**`: Admin department management
  - `GET /api/departments/my/stats`: Officer department stats
  - `POST /api/feedback`: Citizen rating (1 to 5) and comments
  - `GET /api/feedback/{complaintId}`: Retrieve feedback for ticket
  - `GET/PUT/POST /api/notifications/**`: Notifications management
  - `GET/POST/PUT /api/admin/officers/**`: Admin officer management
  - `GET /api/admin/users`: Admin user list
  - `GET /api/admin/stats`: Admin system stats

---

## 2. Common Error Response Shape
HTTP Statuses: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `413 Payload Too Large`, `500 Internal Server Error`
```json
{
  "success": false,
  "error": "Error description",
  "message": "Error description"
}
```

---

## 3. Endpoints Inventory

| Method | Endpoint | Allowed Roles | Description & Return Shape |
|---|---|---|---|
| `GET` | `/api/health` | Public | System health check: `{ "status": "healthy", "timestamp": "...", "database": "UP" }` |
| `POST` | `/api/auth/register` | Public | Citizen signup (role forced to `Citizen`). Returns 201: `{ "token": "...", "user": { ... } }` |
| `POST` | `/api/auth/login` | Public | Login with email and password. Disabled user returns 403. Returns 200: `{ "token": "...", "user": { ... } }` |
| `GET` | `/api/auth/me` | Logged in | Current user profile: `{ "id": 1, "name": "...", "email": "...", "role": "...", "phone": "..." }` |
| `PUT` | `/api/auth/me` | Logged in | Update name and phone: `{ "id": 1, "name": "...", "phone": "..." }` |
| `PUT` | `/api/auth/change-password` | Logged in | Change password with `{ currentPassword, newPassword }`. Returns 200: `{ "success": true, "message": "Password changed successfully" }` |
| `POST` | `/api/complaints` | Citizen | Lodge new civic grievance. Auto-calculates SLA and assigns department based on category. Returns 201. |
| `GET` | `/api/complaints` | All roles | Scoped listing: Citizen sees own; Officer sees own department; Admin sees all. Returns 200 list. |
| `GET` | `/api/complaints/my` | Citizen | Current citizen's complaints. Returns 200 list. |
| `GET` | `/api/complaints/{idOrCode}` | All roles | Ticket detail with timeline and media attachments. Scoped: 403/404 if out of scope. Returns 200. |
| `PUT` | `/api/complaints/{id}/status` | Officer (own dept), Admin | Update ticket status (`InProgress`, `Resolved`, `Closed`). Adds timeline row and notification. Officer updating other department gets 403. |
| `PUT` | `/api/complaints/{id}/department` | Admin | Reassign ticket to another department with timeline row. Returns 200. |
| `GET` | `/api/complaints/draft` | Citizen | Retrieve stored draft complaint: `{ "hasDraft": true, "draft": { ... } }` |
| `POST` | `/api/complaints/draft` | Citizen | Save or update complaint draft. Returns 200. |
| `DELETE` | `/api/complaints/draft` | Citizen | Clear citizen draft complaint. Returns 200. |
| `GET` | `/api/departments` | Public, Officer, Admin | List active departments (Admin sees all): `[ { "id": 1, "name": "...", "code": "...", "active": true } ]` |
| `POST` | `/api/departments` | Admin | Create department `{ name, code, description, contact }`. Returns 201. |
| `PUT` | `/api/departments/{id}` | Admin | Update department details. Returns 200. |
| `PUT` | `/api/departments/{id}/toggle-active` | Admin | Toggle active status. Returns 200. |
| `DELETE` | `/api/departments/{id}` | Admin | Delete department. Returns 409 Conflict if complaints or officers exist in department. Returns 200 if empty. |
| `GET` | `/api/departments/my/stats` | Officer | Department dashboard stats: `{ "departmentId": 1, "departmentName": "...", "total": 12, "submitted": 2, "inProgress": 5, "resolved": 5, "slaBreaches": 0 }` |
| `POST` | `/api/feedback` | Citizen | Record citizen satisfaction rating (1 to 5) and optional comment on resolved complaints. Returns 200. |
| `GET` | `/api/feedback/{complaintId}` | Citizen, Officer, Admin | Retrieve feedback entries for a specific complaint. Returns 200 list. |
| `GET` | `/api/notifications` | Logged in | Get notifications for authenticated user. Returns 200 list. |
| `PUT` | `/api/notifications/{id}/read` | Logged in | Mark single notification as read. Returns 200. |
| `POST` | `/api/notifications` | Logged in | Create user notification. Returns 200. |
| `GET` | `/api/admin/officers` | Admin | List department officers with assigned department name: `[ { "id": 2, "name": "...", "email": "...", "departmentId": 1, "departmentName": "..." } ]` |
| `POST` | `/api/admin/officers` | Admin | Create department officer with initial password and department ID. Returns 201. |
| `PUT` | `/api/admin/officers/{id}` | Admin | Update officer name, phone, department, or optional password. Returns 200. |
| `PUT` | `/api/admin/officers/{id}/toggle-active` | Admin | Toggle officer active state. Returns 200. |
| `GET` | `/api/admin/users` | Admin | Read-only listing of all system users. Returns 200 list. |
| `GET` | `/api/admin/stats` | Admin | Admin overview statistics: `{ "totalComplaints": 45, "openComplaints": 12, "inProgressComplaints": 15, "resolvedComplaints": 16, "rejectedComplaints": 2, "totalOfficers": 8, "totalCitizens": 120, "slaBreaches": 1 }` |
