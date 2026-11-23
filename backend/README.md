# Rajasthan Civic Connect — Spring Boot Backend

Stateless REST API for municipal grievance redressal, department workflows, citizen tracking, and administration.

## Tech Stack
- **Language & Runtime:** Java 21 (Eclipse Temurin)
- **Framework:** Spring Boot 3.5.11 (Spring Security, Spring Data JPA)
- **Security:** Stateless JWT authentication (`io.jsonwebtoken:jjwt`), BCrypt hashing
- **Database:** MySQL 8.0+ via MySQL Connector/J with Hibernate ORM
- **Build & Tests:** Maven 3.9 Wrapper (`mvnw`, `mvnw.cmd`), JUnit 5

## Package Structure
- `com.civicconnect.controller`: REST controllers (Auth, Complaints, Admin, Departments, Feedback, Health)
- `com.civicconnect.service`: Business logic (SLA calculations, role-based authorization, timeline logging)
- `com.civicconnect.repository`: Spring Data JPA repositories
- `com.civicconnect.entity`: JPA data models (User, Department, Complaint, Timeline, Media, Draft)
- `com.civicconnect.security`: JWT filter, security filter chain, CORS configuration

## Local Development
1. Configure `backend/application-local.properties` with your MySQL credentials.
2. Run development server:
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```
3. Run automated tests:
   ```powershell
   .\mvnw.cmd test
   ```
- Local API Base: `http://localhost:8080/api`
- Health Endpoint: `http://localhost:8080/api/health`

## Production Deployment
Packaged via multi-stage Dockerfile and deployed on Render: `https://civic-connect-api-bw8t.onrender.com`.
