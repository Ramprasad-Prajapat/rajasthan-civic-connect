import express from 'express';
import { getAuditLogs, logAuditEvent } from '../services/auditService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// GET /api/audit-logs - Retrieve enterprise audit logs (Admin & Officer only)
router.get('/', authMiddleware, roleMiddleware(['Admin', 'Department Officer']), (req, res) => {
  const logs = getAuditLogs(req.query);
  res.status(200).json({
    success: true,
    data: logs,
    count: logs.length,
    requestId: req.requestId || `REQ-${Date.now()}`
  });
});

// POST /api/audit-logs - Manual audit record creation endpoint
router.post('/', authMiddleware, (req, res) => {
  const record = logAuditEvent({
    ...req.body,
    actorId: req.user.uid || req.user.email,
    actorRole: req.user.role,
    ip: req.ip,
    requestId: req.requestId
  });

  res.status(201).json({
    success: true,
    data: record
  });
});

export default router;
