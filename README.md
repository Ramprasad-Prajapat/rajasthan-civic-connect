# Rajasthan Civic Connect

Rajasthan Civic Connect is a unified citizen grievance redressal and municipal governance platform built for Rajasthan state civic administration. It empowers citizens to lodge and track civic complaints with geo-tagging, photos, and auto-department routing, while enabling department officers to manage grievances within their scoped department and administrators to manage departments, officers, users, and state-wide grievance resolution.

## Technology Stack
- **Frontend:** React 19, Vite, Bootstrap 5, Leaflet Maps
- **Backend:** Java 21, Spring Boot 3.5, Spring Security (stateless JWT), Spring Data JPA, Hibernate
- **Database:** MySQL 8.0+ InnoDB (port `3306`, database `civic_connect`, `utf8mb4_unicode_ci`)
- **Authentication:** Stateless JWT bearer tokens with BCrypt password hashing and role-based access control

## Architecture & Features

### 1. Citizen Portal
- **Lodge Grievance:** Submit complaints with title, description, category, district, ULB, ward, GPS coordinates, and photo proof.
- **Auto-Department Routing & SLA:** Automatically mapped to municipal departments (e.g. Water, Sanitation, Electrical, Sewerage, PWD) with target SLA resolution deadlines.
- **Draft Persistence:** Automatic complaint draft sync to MySQL (`complaint_drafts`), restored across sessions.
- **My Complaints & Timeline:** Track ticket progress with chronological status milestones.
- **Profile & Security:** Update profile details and change password securely.

### 2. Department Officer Portal
- **Department-Scoped Access:** Officers are strictly scoped to their assigned municipal department (`users.department_id`). Cross-department updates are rejected with `403 Forbidden`.
- **Department Metrics:** Dashboard count cards: Total, Submitted, In Progress, Resolved, and SLA Breaches.
- **Workflow Management:** Filter grievances, inspect before/after photos, and transition statuses (`InProgress`, `Resolved`, `Closed`) with remarks and citizen notifications.

### 3. Administrator Portal
- **State-Wide Overview:** Real-time aggregate statistics on complaints, resolution rates, officer counts, citizen accounts, and SLA breaches.
- **Department Management:** Full CRUD on departments, active state toggling, and 409 Conflict protection preventing deletion of departments with active grievances or officers.
- **Officer Management:** Enrolls department officers with initial credentials, department assignment, and active status toggling.
- **Complaints & Reassignment:** Search all state grievances, reassign tickets across departments with timeline logging, and update statuses.
- **User Directory:** Read-only listing of all registered citizens and staff.

---

## Project Structure
```text
rajasthan-civic-connect/
├── README.md
├── run-project.bat
├── stop-project.bat
├── .gitignore
├── frontend/     React + Vite: package.json, .env.local, index.html, src/
├── backend/      Java Spring Boot: pom.xml, application-local.properties, src/
├── database/     schema.sql (MySQL DDL structure)
├── scripts/      start-all.mjs, stop-all.mjs, verify-all.mjs, smoke-test.mjs, setup-db.mjs
├── docs/         API_CONTRACT.md
└── .agent/       Operational logs and runtime metadata
```

---

## Demo Accounts

| Role | Email | Password | Assigned Scope / Permissions |
|---|---|---|---|
| **Citizen** | `citizen@civic.local` | `Citizen@123` | Citizen Portal: Lodge complaints, draft sync, track tickets |
| **Department Officer (Water)** | `officer@civic.local` | `Officer@123` | Scoped to Water Department tickets and metrics |
| **Department Officer (Sanitation)** | `sanitation.officer@civic.local` | `Officer@123` | Scoped to Sanitation Department tickets and metrics |
| **Admin** | `admin@civic.local` | `Admin@123` | Full admin governance: departments, officers, users, stats |

---

## Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or later (tested on Node v20 / v24)
- **Java Development Kit (JDK):** JDK 21+ (OpenJDK or Oracle JDK)
- **Build Tool:** Apache Maven 3.9+ (or IntelliJ IDEA Maven)
- **Database Server:** MySQL Server 8.0+ running on `127.0.0.1:3306`

### Database Setup
Ensure databases `civic_connect` and `civic_connect_test` exist on MySQL 3306 with user `civic_app`:
```sql
CREATE DATABASE IF NOT EXISTS civic_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS civic_connect_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'civic_app'@'127.0.0.1' IDENTIFIED BY 'CA254mxYNFjspWQpC25asj7Z';
CREATE USER IF NOT EXISTS 'civic_app'@'localhost' IDENTIFIED BY 'CA254mxYNFjspWQpC25asj7Z';
GRANT ALL PRIVILEGES ON civic_connect.* TO 'civic_app'@'127.0.0.1', 'civic_app'@'localhost';
GRANT ALL PRIVILEGES ON civic_connect_test.* TO 'civic_app'@'127.0.0.1', 'civic_app'@'localhost';
FLUSH PRIVILEGES;
```

### Configuration
1. **Backend:** Configured in `backend/application-local.properties`:
   ```properties
   MYSQL_HOST=127.0.0.1
   MYSQL_PORT=3306
   spring.datasource.url=jdbc:mysql://127.0.0.1:3306/civic_connect?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
   spring.datasource.username=civic_app
   spring.datasource.password=CA254mxYNFjspWQpC25asj7Z
   app.jwt.secret=aa35c6cdabf9fe2f1fc071fc4f50c951754a4c44f572904959262ebb8e9ae703
   app.seed-demo-users=true
   ```
2. **Frontend:** Configured in `frontend/.env.local`:
   ```properties
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

### Running the Application
To start both backend and frontend servers:
```bat
run-project.bat
```
- **Backend API:** `http://localhost:8080/api`
- **Frontend UI:** `http://localhost:5173`

To stop all background servers cleanly:
```bat
stop-project.bat
```

To run the complete verification suite (tests, package, smoke test, restart persistence, frontend build):
```bash
node scripts/verify-all.mjs
```

---

## 5 Practical SQL Verification Queries

```sql
-- 1. List active complaints grouped by department and status
SELECT d.name AS department, c.status, COUNT(*) AS total_tickets
FROM civic_connect.complaints c
JOIN civic_connect.departments d ON c.department_id = d.id
GROUP BY d.name, c.status
ORDER BY d.name, c.status;

-- 2. Detect SLA breaches across unresolved complaints
SELECT c.complaint_code, c.title, d.name AS department, c.sla_deadline, c.status
FROM civic_connect.complaints c
JOIN civic_connect.departments d ON c.department_id = d.id
WHERE c.sla_deadline < NOW() AND c.status NOT IN ('Resolved', 'Closed');

-- 3. Department performance and resolution summary
SELECT d.name AS department,
       COUNT(c.id) AS total_assigned,
       SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_count,
       SUM(CASE WHEN c.status = 'Submitted' THEN 1 ELSE 0 END) AS pending_count
FROM civic_connect.departments d
LEFT JOIN civic_connect.complaints c ON c.department_id = d.id
GROUP BY d.id, d.name;

-- 4. Active officers and their assigned department scope
SELECT u.id, u.name, u.email, u.phone, d.name AS assigned_department, u.active
FROM civic_connect.users u
JOIN civic_connect.departments d ON u.department_id = d.id
WHERE u.role IN ('Department Officer', 'Officer');

-- 5. Full chronological audit timeline for a specific complaint
SELECT t.action, t.status, t.remarks, t.performed_by, t.role, t.timestamp
FROM civic_connect.complaint_timeline t
WHERE t.complaint_id = 1
ORDER BY t.timestamp ASC;
```

---

## Git Quick-Start
```bash
# Check repository status
git status

# View commit history
git log --oneline -5

# Run test suite
mvn test -f backend/pom.xml
npm run build --prefix frontend
```
