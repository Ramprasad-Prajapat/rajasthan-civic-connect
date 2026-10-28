package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * User account entity representing citizens and municipal staff.
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
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.email != null) {
            this.email = this.email.toLowerCase().trim();
        }
    }

    // Getters and Setters
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

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
