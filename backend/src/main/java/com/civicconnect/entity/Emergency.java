package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Emergency SOS report entity tracking rapid-action incidents.
 */
@Entity
@Table(name = "emergencies", indexes = {
        @Index(name = "idx_emergency_code", columnList = "emergency_code", unique = true)
})
public class Emergency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "emergency_code", nullable = false, unique = true, length = 64)
    private String emergencyCode;

    @Column(nullable = false, length = 64)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String location;

    private Double latitude;
    private Double longitude;

    @Column(name = "reporter_name")
    private String reporterName;

    @Column(name = "reporter_phone")
    private String reporterPhone;

    @Column(name = "reporter_email")
    private String reporterEmail;

    @Column(name = "reporter_role")
    private String reporterRole;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 32)
    private String status = "Reported";

    @Column(name = "officer_handshake", length = 64)
    private String officerHandshake;

    @Column(name = "invalid_reason", columnDefinition = "TEXT")
    private String invalidReason;

    @Column(name = "photo_data_url", columnDefinition = "LONGTEXT")
    private String photoDataUrl;

    @Column(name = "extra_json", columnDefinition = "TEXT")
    private String extraJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Emergency() {}

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = Instant.now();
        if (this.updatedAt == null) this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmergencyCode() { return emergencyCode; }
    public void setEmergencyCode(String emergencyCode) { this.emergencyCode = emergencyCode; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getReporterName() { return reporterName; }
    public void setReporterName(String reporterName) { this.reporterName = reporterName; }

    public String getReporterPhone() { return reporterPhone; }
    public void setReporterPhone(String reporterPhone) { this.reporterPhone = reporterPhone; }

    public String getReporterEmail() { return reporterEmail; }
    public void setReporterEmail(String reporterEmail) { this.reporterEmail = reporterEmail; }

    public String getReporterRole() { return reporterRole; }
    public void setReporterRole(String reporterRole) { this.reporterRole = reporterRole; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOfficerHandshake() { return officerHandshake; }
    public void setOfficerHandshake(String officerHandshake) { this.officerHandshake = officerHandshake; }

    public String getInvalidReason() { return invalidReason; }
    public void setInvalidReason(String invalidReason) { this.invalidReason = invalidReason; }

    public String getPhotoDataUrl() { return photoDataUrl; }
    public void setPhotoDataUrl(String photoDataUrl) { this.photoDataUrl = photoDataUrl; }

    public String getExtraJson() { return extraJson; }
    public void setExtraJson(String extraJson) { this.extraJson = extraJson; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
