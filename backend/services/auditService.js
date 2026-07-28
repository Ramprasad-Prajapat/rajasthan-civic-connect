/**
 * Enterprise Audit Logging Service for RajCivic Connect
 * Records auditable actions across state, district, ULB, and user operations.
 */
import fs from 'fs';
import path from 'path';

const auditLogsStore = [];
const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export function logAuditEvent(params = {}) {
  const {
    actorId = 'SYSTEM',
    actorRole = 'System',
    action = 'UNKNOWN_ACTION',
    entityType = 'General',
    entityId = '',
    oldValue = null,
    newValue = null,
    ip = '127.0.0.1',
    requestId = `REQ-${Date.now()}`
  } = params;

  const auditRecord = {
    auditId: `AUDIT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    actorId,
    actorRole,
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
    timestamp: new Date().toISOString(),
    ip,
    requestId
  };

  auditLogsStore.unshift(auditRecord);

  // Keep store capped at 500 records in memory for local speed
  if (auditLogsStore.length > 500) {
    auditLogsStore.pop();
  }

  // Asynchronously append log entry to disk file for audit trail persistence
  try {
    const logFilePath = path.join(logDir, 'audit_trail.log');
    fs.appendFileSync(logFilePath, JSON.stringify(auditRecord) + '\n', 'utf8');
  } catch (err) {
    console.error('Audit trail file append error:', err.message);
  }

  return auditRecord;
}

export function getAuditLogs(filters = {}) {
  let results = [...auditLogsStore];

  if (filters.actorId) {
    results = results.filter(l => l.actorId === filters.actorId);
  }
  if (filters.action) {
    results = results.filter(l => l.action === filters.action);
  }
  if (filters.entityType) {
    results = results.filter(l => l.entityType === filters.entityType);
  }

  const limit = parseInt(filters.limit, 10) || 50;
  return results.slice(0, limit);
}
