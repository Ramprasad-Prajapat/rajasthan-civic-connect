package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Citizen feedback on resolved grievances.
 */
@Entity
@Table(name = "feedback", indexes = {
        @Index(name = "idx_feedback_complaint", columnList = "complaint_id")
})
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_id", nullable = false)
    private String complaintId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name")
    private String userName;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Feedback() {}

    public Feedback(String complaintId, Long userId, String userName, Integer rating, String comment) {
        this.complaintId = complaintId;
        this.userId = userId;
        this.userName = userName;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getComplaintId() { return complaintId; }
    public void setComplaintId(String complaintId) { this.complaintId = complaintId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
