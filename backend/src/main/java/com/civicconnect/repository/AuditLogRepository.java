package com.civicconnect.repository;

import com.civicconnect.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for audit trail logs.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop100ByOrderByCreatedAtDesc();
    List<AuditLog> findByEntityAndEntityIdOrderByCreatedAtDesc(String entity, String entityId);
}
