package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * In-app notifications delivered to citizens and staff.
 */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notif_user", columnList = "user_id")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(length = 64)
    private String type = "GENERAL";

    @Column(name = "complaint_id")
    private String complaintId;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Notification() {}

    public Notification(Long userId, String title, String message, String type, String complaintId) {
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type != null ? type : "GENERAL";
        this.complaintId = complaintId;
        this.isRead = false;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getComplaintId() { return complaintId; }
    public void setComplaintId(String complaintId) { this.complaintId = complaintId; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
