package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Municipal department entity managing grievance routing and officers.
 */
@Entity
@Table(name = "departments", indexes = {
        @Index(name = "idx_dept_name", columnList = "name", unique = true)
})
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dept_id", nullable = false, unique = true, length = 64)
    private String deptId;

    @Column(nullable = false, unique = true, length = 128)
    private String name;

    @Column(length = 128)
    private String officer;

    @Column(length = 128)
    private String head;

    @Column(length = 64)
    private String contact;

    @Column(nullable = false, length = 32)
    private String status = "Active";

    @Column(name = "extra_json", columnDefinition = "TEXT")
    private String extraJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Department() {}

    public Department(String deptId, String name, String officer) {
        this.deptId = deptId;
        this.name = name;
        this.officer = officer;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

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

    public String getDeptId() { return deptId; }
    public void setDeptId(String deptId) { this.deptId = deptId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getOfficer() { return officer; }
    public void setOfficer(String officer) { this.officer = officer; }

    public String getHead() { return head; }
    public void setHead(String head) { this.head = head; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getExtraJson() { return extraJson; }
    public void setExtraJson(String extraJson) { this.extraJson = extraJson; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
