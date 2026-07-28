# RajCivic Connect — Disaster Recovery & Backup Manual

## 1. Automated Database Backup System
- **Script Location**: `backend/scripts/backupDatabase.js`
- **Backup Execution**: Executed on scheduled cron jobs or on-demand via `npm run backup` (or `node backend/scripts/backupDatabase.js`).
- **Backup Destination**: Local snapshots exported to `backups/backup_TIMESTAMP.json`.

## 2. Recovery Procedure
1. Verify backup file integrity in `backups/`.
2. Ensure target database node connection parameters match `.env.production`.
3. Execute database seed / restoration module (`backend/seedFirestore.js`).
4. Execute health check endpoints (`/health` & `/api/health/deep`) to confirm recovery.
