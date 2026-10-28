package com.civicconnect.controller;

import com.civicconnect.entity.Emergency;
import com.civicconnect.entity.User;
import com.civicconnect.service.EmergencyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller managing emergency SOS reports.
 */
@RestController
@RequestMapping({"/api/emergencies", "/emergencies"})
public class EmergencyController {

    private final EmergencyService emergencyService;

    public EmergencyController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @GetMapping
    public ResponseEntity<List<Emergency>> getEmergencies(@AuthenticationPrincipal User caller) {
        return ResponseEntity.ok(emergencyService.getEmergencies(caller));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createEmergency(
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal User caller
    ) {
        Map<String, Object> payload = body != null ? body : Map.of();
        Emergency saved = emergencyService.createEmergency(payload, caller);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Emergency recorded successfully",
                "emergencyId", saved.getEmergencyCode(),
                "id", saved.getId()
        ));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateEmergencyStatus(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal User caller
    ) {
        Map<String, Object> payload = body != null ? body : Map.of();
        Emergency updated = emergencyService.updateEmergencyStatus(id, payload, caller);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Emergency status updated",
                "emergencyId", updated.getEmergencyCode(),
                "status", updated.getStatus()
        ));
    }
}
