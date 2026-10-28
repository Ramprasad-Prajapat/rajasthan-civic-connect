package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Municipal field worker entity assigned to grievance resolution.
 */
@Entity
@Table(name = "workers")
public class Worker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(length = 32)
    private String phone;

    @Column(name = "department_id", length = 64)
    private String departmentId;

    @Column(name = "department_name", length = 128)
    private String departmentName;

    @Column(nullable = false, length = 32)
    private String status = "Available";

    @Column(name = "tasks_count", nullable = false)
    private Integer tasksCount = 0;

    @Column(name = "extra_json", columnDefinition = "TEXT")
    private String extraJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Worker() {}

    public Worker(String name, String phone, String departmentId, String departmentName) {
        this.name = name;
        this.phone = phone;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.status = "Available";
        this.tasksCount = 0;
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

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getTasksCount() { return tasksCount; }
    public void setTasksCount(Integer tasksCount) { this.tasksCount = tasksCount; }

    public String getExtraJson() { return extraJson; }
    public void setExtraJson(String extraJson) { this.extraJson = extraJson; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
