# Rajasthan Civic Connect

Rajasthan Civic Connect is a unified citizen grievance redressal and municipal governance platform built for Rajasthan state civic administration. It empowers citizens to lodge, track, and escalate civic complaints with geo-tagging, photos, and auto-department routing, while enabling municipal officers and administrators to oversee SLAs, allocate field workers, manage departments and emergencies, inspect grievance timelines, and analyze real aggregate metrics from MySQL.

## Technology Stack
- **Frontend:** React 19, Vite, Bootstrap 5, Leaflet Maps
- **Backend:** Java 21, Spring Boot 3.5, Spring Security (stateless JWT), Spring Data JPA, Hibernate
- **Database:** MySQL 8.x InnoDB (port `3306`, database `civic_connect`, `utf8mb4_unicode_ci`)
- **Authentication:** Stateless JWT bearer tokens with BCrypt password hashing

## Project Structure
```text
rajasthan-civic-connect/
├── README.md
├── run-project.bat
├── stop-project.bat
├── .gitignore
├── frontend/     React + Vite: package.json, package-lock.json, .env.example, .env.local, index.html, vite.config.js, public/, src/
├── backend/      Java Spring Boot: pom.xml, application-local.properties, src/main, src/test
├── database/     schema.sql
├── scripts/      start-all.mjs, stop-all.mjs, verify-all.mjs, smoke-test.mjs, setup-db.mjs
├── docs/         API_CONTRACT.md
└── .agent/       logs/ and running.json only (runtime files for the launchers)
```

## System Requirements
- **Node.js:** v18.0.0 or later (tested on Node v20 / v24)
- **Java Development Kit (JDK):** JDK 21+ (OpenJDK or Oracle JDK)
- **Build Tool:** Apache Maven 3.9+ or IDE-bundled Maven
- **Database Server:** MySQL Server 8.0+ running on `127.0.0.1:3306`

## Configuration
- **Database Settings:** Stored locally in `backend/application-local.properties` (ignored by git, never committed):
  - `MYSQL_HOST=127.0.0.1`
  - `MYSQL_PORT=3306`
  - `spring.datasource.username=civic_app`
  - `spring.datasource.password=<secure_password>`
  - `app.jwt.secret=<strong_base64_secret_key>`
- **Frontend Configuration:** Configured in `frontend/.env.local`:
  - `VITE_API_BASE_URL=http://localhost:8080/api`

## How to Run

### Automated Launchers (Recommended)
- **Start All Services:**
  ```cmd
  run-project.bat
  ```
  Validates MySQL 3306 connectivity, starts the Spring Boot backend on port `8080`, waits for the health check to report UP, and launches Vite frontend on port `5173`.
- **Stop All Services:**
  ```cmd
  stop-project.bat
  ```
  Gracefully terminates the background processes recorded in `.agent/running.json`.

### Manual Commands
- **Backend:**
  ```cmd
  cd backend
  mvn spring-boot:run
  ```
- **Frontend:**
  ```cmd
  cd frontend
  npm install
  npm run dev
  ```

## Service URLs
- **Citizen & Admin Portal:** [http://localhost:5173](http://localhost:5173)
- **Backend Health Check:** [http://localhost:8080/api/health](http://localhost:8080/api/health)
- **Backend REST API Root:** [http://localhost:8080/api](http://localhost:8080/api)
- **REST API Specifications:** [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)

## Automated Verification Suite
To run the automated verification suite:
```cmd
node scripts/verify-all.mjs
```
The suite executes all 5 stages in one pass:
1. `T1/T2`: 30 Unit & Integration tests against `civic_connect_test` on MySQL 3306.
2. `PKG`: Executable fat JAR build (`target/backend-springboot-0.0.1-SNAPSHOT.jar`).
3. `T3-T5`: Live server smoke testing, CORS preflight verification, and full 46-endpoint contract sweep.
4. `REST`: Backend restart persistence verification (lodged complaint with photo, saved draft, and department persisted across process restarts).
5. `T6`: Frontend Vite production build and bundle identity check.

## Demo Accounts (Development Only)
When `app.seed-demo-users=true` is set in development, pre-seeded accounts are initialized:

| Role | Email | Password | Access & Features |
|---|---|---|---|
| **Citizen** | `citizen@civic.local` | `Citizen@123` | Lodge Grievance, MySQL Draft Sync, My Complaints, Emergency SOS, Feedback |
| **Department Officer** | `officer@civic.local` | `Officer@123` | Department Officer Dashboard, Status Transitions, Assign Field Workers, Emergency Dispatch |
| **Admin** | `admin@civic.local` | `Admin@123` | State Executive Dashboard, Department Management, User Directory, Audit Trail |

> **Security Notice:** Demo credentials and auto-seeding are strictly for local testing and evaluation. Set `app.seed-demo-users=false` and configure a cryptographically secure `app.jwt.secret` before deploying to staging or production.

## Database Inspection
To inspect the relational database data in MySQL 3306 without exposing passwords on the command line:

```sql
-- 1. Check user accounts and role distributions
SELECT role, COUNT(*) AS user_count FROM civic_connect.users GROUP BY role;

-- 2. Inspect active complaints with assigned department and status
SELECT id, complaint_number, title, department_id, status, created_at 
FROM civic_connect.complaints ORDER BY created_at DESC LIMIT 5;

-- 3. Review timeline history and status transitions for complaints
SELECT complaint_id, status, updated_by, remarks, timestamp 
FROM civic_connect.complaint_timeline ORDER BY timestamp DESC LIMIT 5;

-- 4. Check active emergency SOS alerts
SELECT id, emergency_type, severity, status, location, reported_at 
FROM civic_connect.emergencies ORDER BY reported_at DESC LIMIT 5;

-- 5. Inspect immutable administrative audit logs
SELECT id, action, entity_name, entity_id, performed_by, timestamp 
FROM civic_connect.audit_logs ORDER BY timestamp DESC LIMIT 5;
```

## Known Limitations
- **Simulated AI Assist:** Complaint category suggestions and photo inspection heuristics use rule-based simulated heuristics by design rather than live external LLM API keys.
- **Email Notifications / SMS:** SMS OTP delivery logs verification codes to application logs during local evaluation rather than dispatching real cellular SMS messages.
- **Third-Party Social Login:** OAuth2 social sign-in (e.g. Google sign-in) is disabled; users authenticate via secure email and BCrypt-hashed passwords with JWT.
