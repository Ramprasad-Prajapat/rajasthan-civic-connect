package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * System audit log recording security, administrative and lifecycle actions.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_actor", columnList = "actor_id"),
        @Index(name = "idx_audit_created", columnList = "created_at")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_name")
    private String actorName;

    @Column(name = "actor_role", length = 64)
    private String actorRole;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(length = 64)
    private String entity;

    @Column(name = "entity_id", length = 64)
    private String entityId;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AuditLog() {}

    public AuditLog(Long actorId, String actorName, String actorRole, String action, String entity, String entityId, String details) {
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorRole = actorRole;
        this.action = action;
        this.entity = entity;
        this.entityId = entityId;
        this.details = details;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }

    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
