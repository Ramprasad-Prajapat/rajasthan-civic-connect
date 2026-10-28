package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Audit timeline entry tracking complaint status progression.
 */
@Entity
@Table(name = "complaint_timeline", indexes = {
        @Index(name = "idx_timeline_complaint_id", columnList = "complaint_id")
})
public class ComplaintTimeline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_id", nullable = false)
    private Long complaintId;

    @Column(nullable = false)
    private String status;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "updated_by_role")
    private String updatedByRole;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ComplaintTimeline() {}

    public ComplaintTimeline(Long complaintId, String status, String title, String description, String updatedBy, String updatedByRole) {
        this.complaintId = complaintId;
        this.status = status;
        this.title = title;
        this.description = description;
        this.updatedBy = updatedBy;
        this.updatedByRole = updatedByRole;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getComplaintId() { return complaintId; }
    public void setComplaintId(Long complaintId) { this.complaintId = complaintId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public String getUpdatedByRole() { return updatedByRole; }
    public void setUpdatedByRole(String updatedByRole) { this.updatedByRole = updatedByRole; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
