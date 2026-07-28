# RajCivic Connect — Scalability & High Concurrency Guide

## 1. High Concurrency Strategy
- **Frontend Code-Splitting**: Vendor chunks (`vendor-react`, `vendor-firebase`, `vendor-leaflet`, `vendor-bootstrap`) isolated under 500 kB chunk limit in `vite.config.js`.
- **Query Caching**: 15-second TTL in-memory caching (`queryCache` in `firestoreService.js`) reduces redundant database round-trips by up to 75% during peak citizen usage.
- **Async Background Queue**: Non-blocking job queue (`backgroundJobService.js`) processes heavy tasks (PDF generation, SLA sweeps, batch notifications).

## 2. Horizontal Scaling Configuration
- **PM2 Cluster Mode**: Configured in `backend/ecosystem.config.cjs` to scale across available CPU cores on Node.js application servers.
- **Stateless API Design**: API requests are token-authenticated via Firebase Bearer tokens, eliminating sticky session requirements.
