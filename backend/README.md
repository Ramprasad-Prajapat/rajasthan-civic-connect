# Rajasthan Civic Connect — Spring Boot Backend

The backend of Rajasthan Civic Connect is built with Java 21 and Spring Boot 3.5, providing a robust, stateless REST API for municipal grievance redressal, department-scoped workflows, citizen complaint tracking, and administrative governance.

---

## Technology Stack

- **Runtime:** Java 21 (Eclipse Temurin)
- **Framework:** Spring Boot 3.5.11
- **Security:** Spring Security (Stateless JWT via `io.jsonwebtoken:jjwt`, BCrypt password hashing)
- **Persistence:** Spring Data JPA / Hibernate ORM
- **Database:** MySQL 8.0+ / MySQL Connector/J (`com.mysql:mysql-connector-j`)
- **Containerization:** Multi-stage Dockerfile (`maven:3.9-eclipse-temurin-21` -> `eclipse-temurin:21-jre`)
- **Testing:** JUnit 5, Spring Boot Test, Mockito

---

## Architecture & Package Structure

```text
com.civicconnect/
├── CivicConnectApplication.java   # Spring Boot entry point
├── config/
│   └── DataSeeder.java            # Startup seeder for departments, demo accounts, sample tickets
├── controller/
│   ├── AdminController.java       # System stats, officer provisioning, user listing
│   ├── AuthController.java        # Registration, login, JWT issuance, profile
│   ├── ComplaintController.java   # Grievance lodging, listing, status updates, drafts
│   ├── DepartmentController.java  # Department metadata and public listing
│   ├── FeedbackController.java    # Citizen satisfaction feedback
│   ├── HealthController.java      # Liveness / readiness health check (/api/health)
│   └── NotificationController.java# In-app notifications
├── dto/                           # Request & response records
├── entity/                        # JPA entity models (User, Department, Complaint, Timeline, Media, Draft)
├── exception/                     # Global exception handler & custom API exceptions
├── repository/                    # Spring Data JPA repositories
├── security/                      # JWT auth filter, security chain config, CORS allowlist
├── service/                       # Business logic services
└── util/                          # SLA calculator, code generator, constants
```

---

## Local Setup & Running

### Prerequisites
- JDK 21 installed and on `PATH` (`java -version`)
- MySQL 8.0+ running on `127.0.0.1:3306`

### Configuration
Create `backend/application-local.properties` (ignored by Git) based on `application-local.properties.example`:

```properties
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/civic_connect?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=civic_app
spring.datasource.password=your_local_password
app.jwt.secret=your_secure_256_bit_jwt_secret_key_here
app.seed-demo-users=true
```

### Build and Run
Using the included Maven wrapper:

```powershell
# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

The API will be available at: `http://localhost:8080/api`
Health endpoint: `http://localhost:8080/api/health`

### Automated Testing
```powershell
.\mvnw.cmd test
```

---

## API Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | System liveness and health status |
| `POST` | `/api/auth/register` | Public | Register new Citizen account |
| `POST` | `/api/auth/login` | Public | Authenticate and obtain JWT token |
| `GET` | `/api/departments` | Public | List active municipal departments |
| `POST` | `/api/complaints` | Citizen | Lodge a new civic grievance |
| `GET` | `/api/complaints/my` | Citizen | List complaints submitted by logged-in citizen |
| `GET` | `/api/complaints/{idOrCode}` | Authenticated | View complaint details and timeline |
| `GET` | `/api/complaints` | Officer/Admin | List department complaints (scoped by role) |
| `PUT` | `/api/complaints/{id}/status` | Officer/Admin | Update grievance status (In Progress, Resolved) |
| `GET` | `/api/admin/stats` | Admin | System-wide statistics and metrics |
| `GET` | `/api/admin/users` | Admin | Directory of all registered users |

---

## Production Deployment (Render)

The backend is packaged as a lightweight Docker container and deployed as a Render Web Service:
- **Dockerfile:** Multi-stage build in `backend/Dockerfile`
- **Memory Tuning:** `-XX:MaxRAMPercentage=65 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k`
- **Port:** Configured via standard `${PORT:8080}`
- **Production URL:** `https://civic-connect-api-bw8t.onrender.com`
