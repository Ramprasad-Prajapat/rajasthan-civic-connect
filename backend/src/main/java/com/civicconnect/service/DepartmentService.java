package com.civicconnect.service;

import com.civicconnect.dto.CreateDepartmentRequest;
import com.civicconnect.dto.DepartmentResponse;
import com.civicconnect.dto.UpdateDepartmentRequest;
import com.civicconnect.entity.Department;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.DepartmentRepository;
import com.civicconnect.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Service managing municipal department records, activations, and integrity checks.
 */
@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    public DepartmentService(
            DepartmentRepository departmentRepository,
            ComplaintRepository complaintRepository,
            UserRepository userRepository
    ) {
        this.departmentRepository = departmentRepository;
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getActiveDepartments() {
        return departmentRepository.findByActiveTrue().stream()
                .map(DepartmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAllByOrderByNameAsc().stream()
                .map(d -> DepartmentResponse.fromEntity(
                        d,
                        userRepository.countByDepartmentId(d.getId()),
                        complaintRepository.countByDepartmentId(d.getId())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public Department findById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Department not found"));
    }

    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest req) {
        String name = req.name() != null ? req.name().trim() : "";
        if (name.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Department name cannot be blank");
        }
        if (departmentRepository.existsByNameIgnoreCase(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "Department with this name already exists");
        }

        String code = req.code() != null && !req.code().isBlank()
                ? req.code().trim().toUpperCase()
                : name.replaceAll("[^A-Za-z0-9]+", "_").toUpperCase();

        Department dept = new Department(name, code, req.description(), req.contact());
        dept.setActive(true);
        Department saved = departmentRepository.save(dept);
        return DepartmentResponse.fromEntity(saved, 0L, 0L);
    }

    @Transactional
    public DepartmentResponse updateDepartment(Long id, UpdateDepartmentRequest req) {
        Department dept = findById(id);

        if (req.name() != null && !req.name().isBlank()) {
            String newName = req.name().trim();
            if (!newName.equalsIgnoreCase(dept.getName()) && departmentRepository.existsByNameIgnoreCase(newName)) {
                throw new ApiException(HttpStatus.CONFLICT, "Another department already has this name");
            }
            dept.setName(newName);
        }
        if (req.code() != null) {
            dept.setCode(req.code().trim());
        }
        if (req.description() != null) {
            dept.setDescription(req.description().trim());
        }
        if (req.contact() != null) {
            dept.setContact(req.contact().trim());
        }
        if (req.active() != null) {
            dept.setActive(req.active());
        }
        dept.setUpdatedAt(Instant.now());

        Department saved = departmentRepository.save(dept);
        return DepartmentResponse.fromEntity(
                saved,
                userRepository.countByDepartmentId(saved.getId()),
                complaintRepository.countByDepartmentId(saved.getId())
        );
    }

    @Transactional
    public DepartmentResponse setDepartmentActive(Long id, boolean active) {
        Department dept = findById(id);
        dept.setActive(active);
        dept.setUpdatedAt(Instant.now());
        Department saved = departmentRepository.save(dept);
        return DepartmentResponse.fromEntity(
                saved,
                userRepository.countByDepartmentId(saved.getId()),
                complaintRepository.countByDepartmentId(saved.getId())
        );
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department dept = findById(id);

        long complaintCount = complaintRepository.countByDepartmentId(dept.getId());
        long officerCount = userRepository.countByDepartmentId(dept.getId());

        if (complaintCount > 0 || officerCount > 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Cannot delete department with " + complaintCount + " complaints and " + officerCount + " officers. Please deactivate instead."
            );
        }

        departmentRepository.delete(dept);
    }
}
