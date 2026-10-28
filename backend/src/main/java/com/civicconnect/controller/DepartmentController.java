package com.civicconnect.controller;

import com.civicconnect.dto.CreateDepartmentRequest;
import com.civicconnect.dto.DepartmentResponse;
import com.civicconnect.dto.UpdateDepartmentRequest;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.service.DepartmentService;
import com.civicconnect.util.Constants;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller managing municipal departments with role-based administrative control.
 */
@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> getDepartments(@AuthenticationPrincipal User caller) {
        if (caller != null && Constants.ROLE_ADMIN.equalsIgnoreCase(caller.getRole())) {
            return ResponseEntity.ok(departmentService.getAllDepartments());
        }
        return ResponseEntity.ok(departmentService.getActiveDepartments());
    }

    @PostMapping
    public ResponseEntity<DepartmentResponse> createDepartment(
            @Valid @RequestBody CreateDepartmentRequest req,
            @AuthenticationPrincipal User caller
    ) {
        enforceAdmin(caller);
        DepartmentResponse created = departmentService.createDepartment(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentResponse> updateDepartment(
            @PathVariable Long id,
            @RequestBody UpdateDepartmentRequest req,
            @AuthenticationPrincipal User caller
    ) {
        enforceAdmin(caller);
        DepartmentResponse updated = departmentService.updateDepartment(id, req);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/active")
    public ResponseEntity<DepartmentResponse> setDepartmentActive(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User caller
    ) {
        enforceAdmin(caller);
        boolean active = body.get("active") != null ? Boolean.parseBoolean(body.get("active").toString()) : true;
        DepartmentResponse updated = departmentService.setDepartmentActive(id, active);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteDepartment(
            @PathVariable Long id,
            @AuthenticationPrincipal User caller
    ) {
        enforceAdmin(caller);
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(Map.of("message", "Department deleted successfully"));
    }

    private void enforceAdmin(User caller) {
        if (caller == null || !Constants.ROLE_ADMIN.equalsIgnoreCase(caller.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only administrators may manage departments");
        }
    }
}
