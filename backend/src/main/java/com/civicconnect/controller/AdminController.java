package com.civicconnect.controller;

import com.civicconnect.dto.*;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.service.AdminService;
import com.civicconnect.util.Constants;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller handling administrator governance endpoints and department metrics.
 */
@RestController
@RequestMapping("/api")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/admin/officers")
    public ResponseEntity<List<UserResponse>> getOfficers(@AuthenticationPrincipal User caller) {
        enforceAdmin(caller);
        return ResponseEntity.ok(adminService.getOfficers());
    }

    @PostMapping("/admin/officers")
    public ResponseEntity<UserResponse> createOfficer(
            @Valid @RequestBody CreateOfficerRequest req,
            @AuthenticationPrincipal User caller
    ) {
        enforceAdmin(caller);
        UserResponse created = adminService.createOfficer(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/admin/officers/{id}")
    public ResponseEntity<UserResponse> updateOfficer(
            @PathVariable Long id,
            @RequestBody UpdateOfficerRequest req,
            @AuthenticationPrincipal User caller
    ) {
        enforceAdmin(caller);
        UserResponse updated = adminService.updateOfficer(id, req);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/admin/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(@AuthenticationPrincipal User caller) {
        enforceAdmin(caller);
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<AdminStatsResponse> getAdminStats(@AuthenticationPrincipal User caller) {
        enforceAdmin(caller);
        return ResponseEntity.ok(adminService.getAdminStats());
    }

    @GetMapping("/department/stats")
    public ResponseEntity<DepartmentStatsResponse> getDepartmentStats(@AuthenticationPrincipal User caller) {
        if (caller == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (!Constants.ROLE_OFFICER.equalsIgnoreCase(caller.getRole()) &&
            !Constants.ROLE_OFFICER_ALT.equalsIgnoreCase(caller.getRole()) &&
            !Constants.ROLE_ADMIN.equalsIgnoreCase(caller.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only department officers and admins may view department statistics");
        }
        return ResponseEntity.ok(adminService.getDepartmentStats(caller));
    }

    private void enforceAdmin(User caller) {
        if (caller == null || !Constants.ROLE_ADMIN.equalsIgnoreCase(caller.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Administrative privileges required");
        }
    }
}
