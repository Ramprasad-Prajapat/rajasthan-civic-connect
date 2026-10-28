package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * User account entity representing citizens, officers, and administrators.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 191)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    private String phone;

    @Column(nullable = false)
    private String role;

    private String portal;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public User() {}

    public User(String name, String email, String passwordHash, String phone, String role, String portal) {
        this.name = name;
        this.email = email != null ? email.toLowerCase().trim() : null;
        this.passwordHash = passwordHash;
        this.phone = phone;
        this.role = role;
        this.portal = portal != null ? portal : "citizen";
        this.active = true;
        this.createdAt = Instant.now();
    }

    public User(String name, String email, String passwordHash, String phone, String role, String portal, Long departmentId) {
        this(name, email, passwordHash, phone, role, portal);
        this.departmentId = departmentId;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.active == null) {
            this.active = true;
        }
        if (this.email != null) {
            this.email = this.email.toLowerCase().trim();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email != null ? email.toLowerCase().trim() : null; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPortal() { return portal; }
    public void setPortal(String portal) { this.portal = portal; }

    public Boolean getActive() { return active != null ? active : true; }
    public boolean isActive() { return Boolean.TRUE.equals(active); }
    public void setActive(Boolean active) { this.active = active; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
