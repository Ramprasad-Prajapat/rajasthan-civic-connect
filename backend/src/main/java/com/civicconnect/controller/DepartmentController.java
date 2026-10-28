package com.civicconnect.controller;

import com.civicconnect.entity.Department;
import com.civicconnect.service.DepartmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller managing municipal departments.
 */
@RestController
@RequestMapping({"/api/departments", "/departments"})
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public ResponseEntity<List<Department>> getDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @PostMapping
    public ResponseEntity<Department> createDepartment(@RequestBody Map<String, Object> payload) {
        Department dept = departmentService.createDepartment(payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(dept);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Department> updateDepartment(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        Department dept = departmentService.updateDepartment(id, payload);
        return ResponseEntity.ok(dept);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteDepartment(@PathVariable String id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(Map.of("message", "Department deleted successfully"));
    }
}
