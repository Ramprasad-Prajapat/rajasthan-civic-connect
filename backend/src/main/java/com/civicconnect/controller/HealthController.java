package com.civicconnect.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Health check endpoint for system monitoring and automated verification.
 */
@RestController
public class HealthController {

    private final Environment springEnvironment;

    @Value("${app.environment:}")
    private String configuredEnvironment;

    public HealthController(Environment springEnvironment) {
        this.springEnvironment = springEnvironment;
    }

    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "healthy",
                "timestamp", Instant.now().toString(),
                "environment", resolveEnvironment()
        ));
    }

    private String resolveEnvironment() {
        if (configuredEnvironment != null && !configuredEnvironment.isBlank()) {
            return configuredEnvironment.trim();
        }
        String[] activeProfiles = springEnvironment.getActiveProfiles();
        if (activeProfiles.length > 0) {
            return String.join(",", activeProfiles);
        }
        return "development";
    }
}
