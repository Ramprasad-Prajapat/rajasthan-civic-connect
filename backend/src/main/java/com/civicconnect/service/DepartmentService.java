package com.civicconnect.service;

import com.civicconnect.entity.Department;
import com.civicconnect.repository.DepartmentRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Service managing municipal department records with automatic seed initialization.
 */
@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @PostConstruct
    @Transactional
    public void seedInitialDepartments() {
        if (departmentRepository.count() == 0) {
            List<Department> defaults = List.of(
                    new Department("sanitation", "Sanitation Department", "Amit Kumar"),
                    new Department("electrical", "Electrical Department", "Rajesh Sharma"),
                    new Department("water", "Water Department", "Sunil Verma"),
                    new Department("sewerage", "Sewerage Department", "Dinesh Gupta"),
                    new Department("pworks", "Public Works Department", "Vikram Singh")
            );
            defaults.forEach(d -> {
                d.setHead(d.getOfficer());
                d.setContact("0141-2740000");
                departmentRepository.save(d);
            });
        }
    }

    @Transactional(readOnly = true)
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @Transactional
    public Department createDepartment(Map<String, Object> payload) {
        String name = payload.get("name") != null && !payload.get("name").toString().isBlank() ?
                payload.get("name").toString().trim() : "Department " + System.currentTimeMillis();

        if (departmentRepository.existsByName(name)) {
            name = name + " " + System.currentTimeMillis();
        }

        String deptId = payload.get("deptId") != null ? payload.get("deptId").toString().trim() :
                (payload.get("id") != null ? payload.get("id").toString().trim() :
                name.toLowerCase().replaceAll("[^a-z0-9]+", "_"));

        Department dept = new Department(deptId, name, payload.get("officer") != null ? payload.get("officer").toString() : "");
        dept.setHead(payload.get("head") != null ? payload.get("head").toString() : dept.getOfficer());
        dept.setContact(payload.get("contact") != null ? payload.get("contact").toString() : "");
        return departmentRepository.save(dept);
    }

    @Transactional
    public Department updateDepartment(String idOrDeptId, Map<String, Object> payload) {
        Department dept = departmentRepository.findByDeptId(idOrDeptId)
                .or(() -> {
                    try {
                        return departmentRepository.findById(Long.parseLong(idOrDeptId));
                    } catch (NumberFormatException e) {
                        return java.util.Optional.empty();
                    }
                })
                .orElseGet(() -> {
                    Department d = new Department(idOrDeptId, "Department " + idOrDeptId, "Officer");
                    return departmentRepository.save(d);
                });

        if (payload.containsKey("name") && payload.get("name") != null) {
            dept.setName(payload.get("name").toString().trim());
        }
        if (payload.containsKey("officer") && payload.get("officer") != null) {
            dept.setOfficer(payload.get("officer").toString().trim());
        }
        if (payload.containsKey("head") && payload.get("head") != null) {
            dept.setHead(payload.get("head").toString().trim());
        }
        if (payload.containsKey("contact") && payload.get("contact") != null) {
            dept.setContact(payload.get("contact").toString().trim());
        }
        if (payload.containsKey("status") && payload.get("status") != null) {
            dept.setStatus(payload.get("status").toString().trim());
        }
        dept.setUpdatedAt(Instant.now());
        return departmentRepository.save(dept);
    }

    @Transactional
    public void deleteDepartment(String idOrDeptId) {
        departmentRepository.findByDeptId(idOrDeptId)
                .or(() -> {
                    try {
                        return departmentRepository.findById(Long.parseLong(idOrDeptId));
                    } catch (NumberFormatException e) {
                        return java.util.Optional.empty();
                    }
                })
                .ifPresent(departmentRepository::delete);
    }
}
