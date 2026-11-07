# Rajasthan Civic Connect — Cloud Production Deployment Guide

This document details the production cloud topology, service configurations, environment variables, security measures, and verification procedures for Rajasthan Civic Connect.

---

## 1. Cloud Architecture Overview

The production system is deployed across three specialized cloud platforms:

```text
┌─────────────────────────────────┐
│         Vercel (Frontend)       │
│  React 19 + Vite 8 SPA          │
│  https://rajasthan-civic-       │
│         connect.vercel.app      │
└────────────────┬────────────────┘
                 │ HTTPS / REST (JWT)
                 ▼
┌─────────────────────────────────┐
│         Render (Backend)        │
│  Spring Boot 3.5 / Java 21 JRE  │
│  https://civic-connect-         │
│         api-bw8t.onrender.com   │
└────────────────┬────────────────┘
                 │ TLS / SSL Mode: REQUIRED
                 ▼
┌─────────────────────────────────┐
│          Aiven (Database)       │
│  Managed MySQL 8.4 Server       │
│  Database: civic_connect        │
│  Host: mysql-7055420-...        │
└─────────────────────────────────┘
```

---

## 2. Live Production URLs

- **Frontend (Vercel):** [https://rajasthan-civic-connect.vercel.app](https://rajasthan-civic-connect.vercel.app)
- **Backend API (Render):** [https://civic-connect-api-bw8t.onrender.com](https://civic-connect-api-bw8t.onrender.com)
- **Health Check Endpoint:** [https://civic-connect-api-bw8t.onrender.com/api/health](https://civic-connect-api-bw8t.onrender.com/api/health)

---

## 3. Database Configuration (Aiven MySQL)

- **Service Name:** `mysql-7055420`
- **Plan:** `free-1-1gb`
- **Engine Version:** MySQL 8.4
- **Database Name:** `civic_connect` (Character Set: `utf8mb4`, Collation: `utf8mb4_unicode_ci`)
- **Connection Security:** Enforced SSL (`sslMode=REQUIRED`, TLS 1.3)
- **Tables (8 Entity Tables):**
  - `users` — Citizen, Officer, Admin identities with BCrypt hashes
  - `departments` — Municipal departments (Water, Sanitation, PWD, Electricity, General)
  - `complaints` — Core grievance records with SLA tracking and geolocation
  - `complaint_timelines` — Chronological audit trail of grievance status changes
  - `complaint_media` — Photos and attachments linked to complaints
  - `complaint_drafts` — Autosaved in-progress grievance forms
  - `feedback` — Post-resolution citizen satisfaction ratings and comments
  - `notifications` — Role-based notification events

---

## 4. Backend Configuration (Render Web Service)

- **Service Name:** `civic-connect-api`
- **Runtime:** Docker (Multi-stage Eclipse Temurin 21)
- **Plan:** Free
- **Region:** Singapore
- **Health Check Path:** `/api/health`

### Environment Variables

| Variable Name | Description | Example / Template |
|---|---|---|
| `PORT` | Injected by Render runtime | `10000` |
| `SPRING_DATASOURCE_URL` | JDBC connection URL with SSL | `jdbc:mysql://<AIVEN_HOST>:<AIVEN_PORT>/civic_connect?sslMode=REQUIRED&serverTimezone=UTC` |
| `SPRING_DATASOURCE_USERNAME` | Aiven database username | `<AIVEN_DB_USER>` |
| `SPRING_DATASOURCE_PASSWORD` | Aiven database password | `<AIVEN_DB_PASSWORD>` |
| `APP_JWT_SECRET` | 256-bit random hex key for JWT signing | `<64_HEX_RANDOM_STRING>` |
| `APP_SEED_DEMO_USERS` | Seeds standard demo accounts on initial run | `true` |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins | `http://localhost:5173,https://rajasthan-civic-connect.vercel.app` |

---

## 5. Frontend Configuration (Vercel)

- **Project Name:** `rajasthan-civic-connect`
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Environment Variables

| Variable Name | Description | Value |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the Spring Boot REST API | `https://civic-connect-api-bw8t.onrender.com/api` |

> **Security Note:** Vite injects `VITE_` variables into client-side bundles at build time. Never place secrets, database credentials, or signing keys into `VITE_` variables.

---

## 6. Security & Hardening Measures

1. **CORS Enforcement:** The Spring Security filter chain restricts cross-origin resource access strictly to the configured Vercel production domain. Unrecognized origins receive HTTP `403 Forbidden`.
2. **Stateless JWT:** Authentication uses short-lived JSON Web Tokens passed via the `Authorization: Bearer <token>` header. No session state is retained on the backend.
3. **Password Security:** All passwords are encrypted with BCrypt (strength 10).
4. **Zero Localhost Leaks:** Production build audits confirm zero hardcoded references to `localhost` in client-facing code.
5. **Role-Based Authorization:**
   - Citizens can only view and lodge their own grievances.
   - Officers are restricted strictly to complaints within their assigned department.
   - Administrative endpoints (`/api/admin/**`) are restricted exclusively to `ROLE_ADMIN`.

---

## 7. Demo Accounts (Evaluation Only)

| Role | Username / Email | Password | Scope / Permissions |
|---|---|---|---|
| **Citizen** | `citizen@civic.local` | `Citizen@123` | Lodge grievances, GPS tagging, timeline tracking |
| **Water Officer** | `officer@civic.local` | `Officer@123` | Scoped to Water Department complaints & resolution |
| **Sanitation Officer** | `sanitation.officer@civic.local` | `Officer@123` | Scoped to Sanitation Department complaints |
| **Administrator** | `admin@civic.local` | `Admin@123` | Full governance, metrics, user & officer management |

---

## 8. Operational Notes

- **Render Cold Starts:** On Render's free tier, backend instances spin down after 15 minutes of inactivity. The initial incoming request may take 30–50 seconds to complete while the JVM container initializes.
- **Aiven Inactivity:** Free-tier MySQL instances on Aiven may power down during extended periods of inactivity. Ensure the service is in the `RUNNING` state before traffic tests.
