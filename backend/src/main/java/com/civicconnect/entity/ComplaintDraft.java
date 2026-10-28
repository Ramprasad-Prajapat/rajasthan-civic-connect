package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Stores incomplete grievance draft forms per authenticated citizen.
 */
@Entity
@Table(name = "complaint_drafts", indexes = {
        @Index(name = "idx_draft_user", columnList = "user_id", unique = true)
})
public class ComplaintDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(columnDefinition = "LONGTEXT")
    private String payload;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public ComplaintDraft() {}

    public ComplaintDraft(Long userId, String payload) {
        this.userId = userId;
        this.payload = payload;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
