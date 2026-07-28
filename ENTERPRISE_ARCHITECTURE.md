# RajCivic Connect — Enterprise Architecture Manual

## 1. System Overview
RajCivic Connect is an enterprise multi-tenant municipal governance platform engineered for high-concurrency public grievance management across Rajasthan State Municipal Corporations (Nagar Nigam, Nagar Parishad, Nagar Palika).

## 2. Layered Component Architecture
```
[ Citizen / Field Force / Municipal Officers ]
                      │
           (HTTPS / WSS / REST API)
                      ↓
[ Edge Network / CDN / Web Gateway ]
  ├── Static SPA Assets (Vite 8 / React 19)
  └── Reverse Proxy / SSL Termination
                      ↓
[ Express.js API Cluster (Node.js 20 ESModules) ]
  ├── Auth & RBAC Security Middleware
  ├── Correlation Request ID Middleware (X-Request-ID)
  ├── Rate Limiter (Auth & General API)
  ├── Service Layer (aiService, SLA Engine, Audit Service)
  └── Controller Layer
                      ↓
[ Database & Storage Node Infrastructure ]
  ├── Firebase Firestore (Geo-tagged document collections)
  ├── Firebase Realtime Database (Live status sync)
  └── Firebase Storage (Before/After resolution proof media)
```

## 3. Security & Governance Boundaries
- **Firestore Security Rules**: Role-based access control (`firestore.rules`).
- **Audit Logging**: Asynchronous audit logger (`auditService.js`) recording state changes with request correlation IDs.
- **Data Protection**: Zero exposure of service credentials or private keys in client builds.
