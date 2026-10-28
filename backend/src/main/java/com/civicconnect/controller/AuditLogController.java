package com.civicconnect.controller;

import com.civicconnect.entity.AuditLog;
import com.civicconnect.entity.User;
import com.civicconnect.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller managing system audit logs.
 */
@RestController
@RequestMapping({"/api/audit-logs", "/audit-logs"})
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAuditLogs(@AuthenticationPrincipal User caller) {
        List<AuditLog> logs = auditLogService.getAuditLogs(caller);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", logs,
                "count", logs.size()
        ));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAuditLog(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User caller
    ) {
        AuditLog saved = auditLogService.recordClientLog(body, caller);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "data", saved,
                "id", saved.getId()
        ));
    }
}
