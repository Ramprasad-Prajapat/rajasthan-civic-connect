/**
 * Enterprise SLA Monitoring & Automated Escalation Engine
 */
import { logAuditEvent } from './auditService.js';

export const SLA_THRESHOLDS_HOURS = {
  Emergency: 6,
  Critical: 12,
  High: 24,
  Medium: 48,
  Low: 72
};

export function evaluateSlaStatus(complaint = {}) {
  if (!complaint.createdAt || complaint.status === 'Closed' || complaint.status === 'Resolved') {
    return { state: 'Resolved', remainingHours: 0, isBreached: false };
  }

  const createdTime = new Date(complaint.createdAt).getTime();
  const slaHours = complaint.slaHours || SLA_THRESHOLDS_HOURS[complaint.priority] || 48;
  const deadline = createdTime + (slaHours * 60 * 60 * 1000);
  const now = Date.now();
  const diffMs = deadline - now;
  const remainingHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

  if (diffMs <= 0) {
    return { state: 'Breached', remainingHours: 0, isBreached: true };
  } else if (remainingHours <= 4) {
    return { state: 'At Risk', remainingHours, isBreached: false };
  } else if (remainingHours <= 12) {
    return { state: 'Warning', remainingHours, isBreached: false };
  }

  return { state: 'On Time', remainingHours, isBreached: false };
}

export function runSlaEscalationSweep(complaintsList = []) {
  const escalatedComplaints = [];

  for (const complaint of complaintsList) {
    const sla = evaluateSlaStatus(complaint);
    if (sla.isBreached && complaint.status !== 'Escalated') {
      const updated = {
        ...complaint,
        status: 'Escalated',
        slaState: 'Breached',
        escalatedAt: new Date().toISOString()
      };

      logAuditEvent({
        actorId: 'SLA_ENGINE',
        actorRole: 'System',
        action: 'SLA_AUTOMATED_ESCALATION',
        entityType: 'Complaint',
        entityId: complaint.complaintId || complaint.id,
        oldValue: complaint.status,
        newValue: 'Escalated'
      });

      escalatedComplaints.push(updated);
    }
  }

  return escalatedComplaints;
}
