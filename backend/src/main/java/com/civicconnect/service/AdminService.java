package com.civicconnect.service;

import com.civicconnect.dto.*;
import com.civicconnect.entity.Department;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.DepartmentRepository;
import com.civicconnect.repository.UserRepository;
import com.civicconnect.util.Constants;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service orchestrating administrator capabilities: officer management, user directory, and system statistics.
 */
@Service
public class AdminService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            ComplaintRepository complaintRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.complaintRepository = complaintRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getOfficers() {
        Map<Long, String> deptMap = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName, (a, b) -> a));

        return userRepository.findByRoleIn(Set.of(Constants.ROLE_OFFICER, Constants.ROLE_OFFICER_ALT)).stream()
                .map(u -> UserResponse.fromEntity(u, u.getDepartmentId() != null ? deptMap.get(u.getDepartmentId()) : null))
                .toList();
    }

    @Transactional
    public UserResponse createOfficer(CreateOfficerRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "User with this email already exists");
        }

        Department dept = departmentRepository.findById(req.departmentId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Target department not found"));

        User officer = new User();
        officer.setName(req.name().trim());
        officer.setEmail(email);
        officer.setPasswordHash(passwordEncoder.encode(req.initialPassword()));
        officer.setPhone(req.phone());
        officer.setRole(Constants.ROLE_OFFICER);
        officer.setPortal("department");
        officer.setActive(true);
        officer.setDepartmentId(dept.getId());

        User saved = userRepository.save(officer);
        return UserResponse.fromEntity(saved, dept.getName());
    }

    @Transactional
    public UserResponse updateOfficer(Long id, UpdateOfficerRequest req) {
        User officer = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Officer not found"));

        if (!Constants.ROLE_OFFICER.equalsIgnoreCase(officer.getRole()) &&
            !Constants.ROLE_OFFICER_ALT.equalsIgnoreCase(officer.getRole())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected user is not an officer");
        }

        if (req.departmentId() != null) {
            Department dept = departmentRepository.findById(req.departmentId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Department not found"));
            officer.setDepartmentId(dept.getId());
        }
        if (req.active() != null) {
            officer.setActive(req.active());
        }
        if (req.name() != null && !req.name().isBlank()) {
            officer.setName(req.name().trim());
        }
        if (req.phone() != null) {
            officer.setPhone(req.phone().trim());
        }

        User saved = userRepository.save(officer);
        String deptName = saved.getDepartmentId() != null
                ? departmentRepository.findById(saved.getDepartmentId()).map(Department::getName).orElse(null)
                : null;
        return UserResponse.fromEntity(saved, deptName);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        Map<Long, String> deptMap = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName, (a, b) -> a));

        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(u -> UserResponse.fromEntity(u, u.getDepartmentId() != null ? deptMap.get(u.getDepartmentId()) : null))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getAdminStats() {
        long totalComplaints = complaintRepository.count();
        long submitted = complaintRepository.countByStatus(Constants.STATUS_SUBMITTED);
        long inProgress = complaintRepository.countByStatus(Constants.STATUS_IN_PROGRESS);
        long resolved = complaintRepository.countByStatus(Constants.STATUS_RESOLVED);
        long closed = complaintRepository.countByStatus(Constants.STATUS_CLOSED);
        long overdue = complaintRepository.countSlaBreaches();

        long totalDepartments = departmentRepository.count();
        long totalOfficers = userRepository.countByRoleIn(Set.of(Constants.ROLE_OFFICER, Constants.ROLE_OFFICER_ALT));
        long totalCitizens = userRepository.countByRole(Constants.ROLE_CITIZEN);

        return new AdminStatsResponse(
                totalComplaints,
                submitted,
                inProgress,
                resolved,
                closed,
                overdue,
                totalDepartments,
                totalOfficers,
                totalCitizens
        );
    }

    @Transactional(readOnly = true)
    public DepartmentStatsResponse getDepartmentStats(User officer) {
        if (officer.getDepartmentId() == null) {
            return new DepartmentStatsResponse(null, "Unassigned", 0L, 0L, 0L, 0L, 0L);
        }

        Long deptId = officer.getDepartmentId();
        String deptName = departmentRepository.findById(deptId)
                .map(Department::getName)
                .orElse("Department #" + deptId);

        long total = complaintRepository.countByDepartmentId(deptId);
        long submitted = complaintRepository.countByDepartmentIdAndStatus(deptId, Constants.STATUS_SUBMITTED);
        long inProgress = complaintRepository.countByDepartmentIdAndStatus(deptId, Constants.STATUS_IN_PROGRESS);
        long resolved = complaintRepository.countByDepartmentIdAndStatus(deptId, Constants.STATUS_RESOLVED);
        long overdue = complaintRepository.countDepartmentSlaBreaches(deptId);

        return new DepartmentStatsResponse(
                deptId,
                deptName,
                total,
                submitted,
                inProgress,
                resolved,
                overdue
        );
    }
}
