package com.civicconnect.service;

import com.civicconnect.entity.AuditLog;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.AuditLogRepository;
import com.civicconnect.util.Constants;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Service capturing and auditing system activity and administrative transitions.
 */
@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLog record(User actor, String action, String entity, String entityId, String details) {
        Long actorId = actor != null ? actor.getId() : null;
        String actorName = actor != null ? actor.getName() : "System";
        String actorRole = actor != null ? actor.getRole() : "System";
        AuditLog log = new AuditLog(actorId, actorName, actorRole, action, entity, entityId, details);
        return auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs(User caller) {
        if (caller == null || !Constants.STAFF_ROLES.contains(caller.getRole().toUpperCase())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only Staff can view audit logs");
        }
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
    }

    @Transactional
    public AuditLog recordClientLog(Map<String, Object> payload, User caller) {
        String action = payload.get("action") != null ? payload.get("action").toString() : "USER_ACTION";
        String entity = payload.get("entity") != null ? payload.get("entity").toString() : "UI";
        String entityId = payload.get("entityId") != null ? payload.get("entityId").toString() : null;
        String details = payload.get("details") != null ? payload.get("details").toString() : "";
        return record(caller, action, entity, entityId, details);
    }
}
