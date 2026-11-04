# Rajasthan Civic Connect

Rajasthan Civic Connect is a unified citizen grievance redressal and municipal governance platform built for Rajasthan state civic administration. It empowers citizens to lodge and track civic complaints with geo-tagging, photos, and auto-department routing, while enabling department officers to manage grievances within their scoped department and administrators to manage departments, officers, users, and state-wide grievance resolution.

---

## Tech Stack

- **Backend:** Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA, Hibernate, JWT (HS256)
- **Frontend:** React 19, Vite (React build tool), plain CSS, browser `fetch`
- **Database:** MySQL 8.0+ (`civic_connect`, port `3306`, `utf8mb4_unicode_ci`)
- **Build & Package:** Apache Maven 3.9+ / Maven Wrapper (`mvnw`, `mvnw.cmd`) & npm
- **Presentation Libraries:** Bootstrap 5, Bootstrap Icons, Leaflet Maps

---

## Folder Tree

```text
rajasthan-civic-connect/
â”œâ”€â”€ README.md                           # Project documentation and setup guide
â”œâ”€â”€ run-project.bat                     # Starts backend and frontend development servers
â”œâ”€â”€ stop-project.bat                    # Stops backend and frontend development servers
â”œâ”€â”€ test-all.bat                        # Runs backend Maven tests and frontend production build
â”œâ”€â”€ .gitignore                          # Git ignore definitions
â”œâ”€â”€ backend/                            # Spring Boot backend
â”‚   â”œâ”€â”€ mvnw                            # Maven Wrapper (Unix)
â”‚   â”œâ”€â”€ mvnw.cmd                        # Maven Wrapper (Windows)
â”‚   â”œâ”€â”€ .mvn/wrapper/                   # Maven Wrapper configuration
â”‚   â”œâ”€â”€ pom.xml                         # Maven project dependencies
â”‚   â”œâ”€â”€ application-local.properties    # Local configuration & credentials (git-ignored)
â”‚   â”œâ”€â”€ application-local.properties.example # Local configuration template
â”‚   â””â”€â”€ src/                            # Java 21 source code & tests
â”œâ”€â”€ frontend/                           # React frontend
â”‚   â”œâ”€â”€ package.json                    # Frontend dependencies & npm scripts (dev, build, preview)
â”‚   â”œâ”€â”€ vite.config.js                  # Vite configuration
â”‚   â”œâ”€â”€ index.html                      # Entry HTML document
â”‚   â”œâ”€â”€ .env.example                    # Frontend environment variables template
â”‚   â”œâ”€â”€ .env.local                      # Local frontend environment variables (git-ignored)
â”‚   â”œâ”€â”€ public/                         # Static image assets
â”‚   â””â”€â”€ src/                            # React JSX components, plain CSS, apiService.js
â”œâ”€â”€ database/                           # Database definitions
â”‚   â””â”€â”€ schema.sql                      # MySQL database schema (8 tables)
â””â”€â”€ docs/                               # Project documentation
    â””â”€â”€ API_CONTRACT.md                 # REST API specification & status codes
```

---

## Requirements

- **Java Development Kit (JDK):** JDK 21+ (OpenJDK or Oracle JDK)
- **Node.js & npm:** Node.js v18.0.0 or later with npm (for frontend React dev server & build)
- **Database Server:** MySQL Server 8.0+ running on `127.0.0.1:3306`
- **Build Tool:** Maven 3.9+ or the included Maven Wrapper (`backend/mvnw.cmd` on Windows)

---

## Database Setup

Execute these 5 SQL commands in MySQL (e.g. via MySQL Command Line Client or Workbench) to set up databases and user permissions:

```sql
CREATE DATABASE IF NOT EXISTS civic_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS civic_connect_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'civic_app'@'127.0.0.1' IDENTIFIED BY '<your_secure_password>';
CREATE USER IF NOT EXISTS 'civic_app'@'localhost' IDENTIFIED BY '<your_secure_password>';
GRANT ALL PRIVILEGES ON civic_connect.* TO 'civic_app'@'127.0.0.1', 'civic_app'@'localhost';
GRANT ALL PRIVILEGES ON civic_connect_test.* TO 'civic_app'@'127.0.0.1', 'civic_app'@'localhost';
FLUSH PRIVILEGES;
```

---

## Configuration

1. **Backend:**
   Copy `backend/application-local.properties.example` to `backend/application-local.properties`:
   ```properties
   MYSQL_HOST=127.0.0.1
   MYSQL_PORT=3306
   spring.datasource.url=jdbc:mysql://127.0.0.1:3306/civic_connect?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
   spring.datasource.username=civic_app
   spring.datasource.password=<your_database_password>
   app.jwt.secret=<your_jwt_secret_minimum_32_characters>
   app.seed-demo-users=true
   ```

2. **Frontend:**
   Copy `frontend/.env.example` to `frontend/.env.local`:
   ```properties
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

---

## Running the Application

To start both the Spring Boot backend and Vite React frontend in separate windows:
```bat
run-project.bat
```
- **Backend Health:** `http://localhost:8080/api/health`
- **Frontend UI:** `http://localhost:5173`

To stop all running application server windows:
```bat
stop-project.bat
```

---

## Testing

To run the complete automated test suite (backend JUnit tests via Maven Wrapper and frontend production build via Vite):
```bat
test-all.bat
```

---

## Roles and Permissions

- **Citizen (`ROLE_CITIZEN`):**
  - Lodge grievances with title, description, category, district, ULB, GPS coordinates, and photo proof.
  - Automatic category-to-department routing (e.g. Water, Sanitation, Road, Drainage).
  - Draft autosave to MySQL (`complaint_drafts`), restored across logins.
  - View own complaints (`/api/complaints/my`), track chronological timeline, and submit satisfaction feedback.
  - Update profile details and change password.

- **Department Officer (`ROLE_OFFICER`):**
  - Scoped strictly to assigned department (`users.department_id`).
  - View complaints assigned to own department only. Attempts to view or update other departments return `403 Forbidden`.
  - View real-time department metrics: Total, Submitted, In Progress, Resolved, and Overdue SLA.
  - Update grievance status (`InProgress`, `Resolved`, `Closed`) with official remarks, updating citizen timeline and notifications.

- **Administrator (`ROLE_ADMIN`):**
  - View state-wide aggregate metrics across all departments and districts.
  - Department management: Create, update, toggle active status, and delete (protected by 409 Conflict if complaints or officers exist).
  - Officer management: Enroll department officers with initial credentials and department assignments; toggle active/disabled status.
  - Complaints governance: Search all complaints, reassign grievances between departments with timeline logging, and update statuses.
  - User directory: View all registered citizens and officers.

---

## Demo Logins (Development Only)

When `app.seed-demo-users=true` is enabled in `application-local.properties`, the following accounts are available:

| Role | Email | Password | Scope / Permissions |
|---|---|---|---|
| **Citizen** | `citizen@civic.local` | `Citizen@123` | Citizen Portal: Lodge complaints, draft sync, track tickets |
| **Department Officer (Water)** | `officer@civic.local` | `Officer@123` | Scoped to Water Department tickets and metrics |
| **Department Officer (Sanitation)** | `sanitation.officer@civic.local` | `Officer@123` | Scoped to Sanitation Department tickets and metrics |
| **Administrator** | `admin@civic.local` | `Admin@123` | Full governance: departments, officers, users, stats |

---

## 5 Practical SQL Verification Queries

```sql
-- 1. Active complaints grouped by department and status
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

-- 5. Full chronological timeline for a specific complaint
SELECT t.title, t.status, t.description, t.updated_by, t.updated_by_role, t.created_at
FROM civic_connect.complaint_timeline t
WHERE t.complaint_id = 1
ORDER BY t.created_at ASC;
```

---

## API Documentation

For the full specification of HTTP methods, routes, request/response JSON schemas, and HTTP status codes, see [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

---

## Known Limitations

- No login lockout or rate limiting on authentication endpoints.
- Mobile responsive design is desktop-first; mobile view uses standard responsive collapse.
- Email and SMS notifications are simulated via database table `notifications`.
- Geocoding and reverse geocoding rely on browser GPS and client-side coordinate accuracy.


---

## Deployment (Production Architecture)

### Architecture
- **Frontend:** Vercel (Static Hosting / Single Page Application)
- **Backend:** Render (Docker Web Service / Java 21 Spring Boot)
- **Database:** Aiven (Managed MySQL Free Tier)

### Environment Variables
- **Vercel (Frontend):**
  - VITE_API_BASE_URL (Points to Render backend, e.g. https://<render-service>.onrender.com/api)
- **Render (Backend):**
  - PORT (Provided by Render, routed to server.port)
  - SPRING_DATASOURCE_URL (JDBC URL: jdbc:mysql://<AIVEN_HOST>:<AIVEN_PORT>/civic_connect?sslMode=REQUIRED&serverTimezone=UTC)
  - SPRING_DATASOURCE_USERNAME (Aiven database user)
  - SPRING_DATASOURCE_PASSWORD (Aiven database password)
  - SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE (Recommended 5 for free tier)
  - SPRING_JPA_HIBERNATE_DDL_AUTO (update)
  - APP_JWT_SECRET (Minimum 32-character / 64-hex random cryptographic secret)
  - APP_CORS_ALLOWED_ORIGINS (Exact Vercel production URL, e.g. https://<app>.vercel.app)
  - APP_SEED_DEMO_USERS (	rue on initial setup to seed demo accounts)

### Free Tier & Operational Notes
- **Render Cold Start:** Free instances sleep after 15 minutes of inactivity. The first request after sleep takes 30–60 seconds while the container initializes.
- **Aiven Inactivity Power-Off:** Free MySQL instances may enter POWEROFF state when idle. Power on from the Aiven console or API before traffic.
- **Demo Accounts Warning:** Public demo credentials are intended solely for evaluation and development. Never enter real personal identifying information or production secrets.
