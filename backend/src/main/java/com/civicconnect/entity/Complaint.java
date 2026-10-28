package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Complaint ticket entity storing grievance details and current lifecycle status.
 */
@Entity
@Table(name = "complaints", indexes = {
        @Index(name = "idx_complaint_code", columnList = "complaint_code", unique = true),
        @Index(name = "idx_citizen_id", columnList = "citizen_id"),
        @Index(name = "idx_department_id", columnList = "department_id")
})
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_code", nullable = false, unique = true, length = 64)
    private String complaintCode;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(name = "sub_category")
    private String subCategory;

    private String district;

    @Column(name = "ulb_type")
    private String ulbType;

    @Column(name = "ulb_name")
    private String ulbName;

    @Column(name = "ward_number")
    private String wardNumber;

    @Column(name = "area_colony")
    private String areaColony;

    @Column(columnDefinition = "TEXT")
    private String address;

    private Double latitude;
    private Double longitude;
    private Double accuracy;

    @Column(name = "location_source")
    private String locationSource;

    @Column(nullable = false)
    private String priority;

    @Column(name = "department_id")
    private Long departmentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", insertable = false, updatable = false)
    private Department department;

    @Transient
    private String departmentName;

    @Column(name = "sla_hours")
    private Integer slaHours;

    @Column(name = "sla_deadline")
    private Instant slaDeadline;

    @Column(nullable = false)
    private String status;

    @Column(name = "citizen_id", nullable = false)
    private Long citizenId;

    @Column(name = "citizen_name")
    private String citizenName;

    @Column(name = "citizen_email")
    private String citizenEmail;

    @Column(name = "citizen_phone")
    private String citizenPhone;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Complaint() {}

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getComplaintCode() { return complaintCode; }
    public void setComplaintCode(String complaintCode) { this.complaintCode = complaintCode; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSubCategory() { return subCategory; }
    public void setSubCategory(String subCategory) { this.subCategory = subCategory; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getUlbType() { return ulbType; }
    public void setUlbType(String ulbType) { this.ulbType = ulbType; }

    public String getUlbName() { return ulbName; }
    public void setUlbName(String ulbName) { this.ulbName = ulbName; }

    public String getWardNumber() { return wardNumber; }
    public void setWardNumber(String wardNumber) { this.wardNumber = wardNumber; }

    public String getAreaColony() { return areaColony; }
    public void setAreaColony(String areaColony) { this.areaColony = areaColony; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }

    public String getLocationSource() { return locationSource; }
    public void setLocationSource(String locationSource) { this.locationSource = locationSource; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) {
        this.department = department;
        if (department != null) {
            this.departmentId = department.getId();
        }
    }

    public String getDepartmentName() {
        if (departmentName != null) {
            return departmentName;
        }
        return department != null ? department.getName() : null;
    }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public Integer getSlaHours() { return slaHours; }
    public void setSlaHours(Integer slaHours) { this.slaHours = slaHours; }

    public Instant getSlaDeadline() { return slaDeadline; }
    public void setSlaDeadline(Instant slaDeadline) { this.slaDeadline = slaDeadline; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getCitizenId() { return citizenId; }
    public void setCitizenId(Long citizenId) { this.citizenId = citizenId; }

    public String getCitizenName() { return citizenName; }
    public void setCitizenName(String citizenName) { this.citizenName = citizenName; }

    public String getCitizenEmail() { return citizenEmail; }
    public void setCitizenEmail(String citizenEmail) { this.citizenEmail = citizenEmail; }

    public String getCitizenPhone() { return citizenPhone; }
    public void setCitizenPhone(String citizenPhone) { this.citizenPhone = citizenPhone; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
