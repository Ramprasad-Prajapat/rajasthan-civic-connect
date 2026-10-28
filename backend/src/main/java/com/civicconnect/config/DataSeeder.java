package com.civicconnect.config;

import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.ComplaintTimeline;
import com.civicconnect.entity.Department;
import com.civicconnect.entity.User;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.ComplaintTimelineRepository;
import com.civicconnect.repository.DepartmentRepository;
import com.civicconnect.repository.UserRepository;
import com.civicconnect.util.Constants;
import com.civicconnect.util.SlaCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Seeds standard departments, demo accounts, and sample complaints at startup if app.seed-demo-users=true.
 * Fully idempotent.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final ComplaintRepository complaintRepository;
    private final ComplaintTimelineRepository timelineRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed-demo-users:false}")
    private boolean seedDemoUsers;

    public DataSeeder(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            ComplaintRepository complaintRepository,
            ComplaintTimelineRepository timelineRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.complaintRepository = complaintRepository;
        this.timelineRepository = timelineRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedDemoUsers) {
            return;
        }

        // 1. Seed standard departments
        Department waterDept = seedDepartmentIfMissing("Water Department", "WATER", "Water Supply and Pipeline Maintenance", "water@civic.local");
        Department sanitationDept = seedDepartmentIfMissing("Sanitation Department", "SANITATION", "Waste Management and Sanitation Services", "sanitation@civic.local");
        Department pwdDept = seedDepartmentIfMissing("Public Works Department", "PWD", "Road and Infrastructure Maintenance", "pwd@civic.local");
        Department elecDept = seedDepartmentIfMissing("Electricity Department", "ELEC", "Power Grid and Street Lighting", "elec@civic.local");
        Department generalDept = seedDepartmentIfMissing("General Municipal Department", "GEN", "General municipal grievances and administrative support", "general@civic.local");

        // 2. Seed demo users
        User citizen = seedUserIfMissing("citizen@civic.local", "Demo Citizen", "Citizen@123", Constants.ROLE_CITIZEN, "citizen", null);
        seedUserIfMissing("officer@civic.local", "Officer Water", "Officer@123", Constants.ROLE_OFFICER, "department", waterDept.getId());
        seedUserIfMissing("officer2@civic.local", "Officer Sanitation", "Officer@123", Constants.ROLE_OFFICER, "department", sanitationDept.getId());
        seedUserIfMissing("sanitation.officer@civic.local", "Officer Sanitation", "Officer@123", Constants.ROLE_OFFICER, "department", sanitationDept.getId());
        seedUserIfMissing("admin@civic.local", "System Administrator", "Admin@123", Constants.ROLE_ADMIN, "admin", null);

        // 3. Seed sample complaints if table is empty
        if (complaintRepository.count() == 0 && citizen != null) {
            seedSampleComplaints(citizen, elecDept, sanitationDept, waterDept);
        }
    }

    private Department seedDepartmentIfMissing(String name, String code, String description, String contact) {
        return departmentRepository.findByNameIgnoreCase(name).map(existing -> {
            boolean updated = false;
            if (code != null && !code.equalsIgnoreCase(existing.getCode())) {
                existing.setCode(code);
                updated = true;
            }
            if (description != null && !description.equals(existing.getDescription())) {
                existing.setDescription(description);
                updated = true;
            }
            if (contact != null && !contact.equals(existing.getContact())) {
                existing.setContact(contact);
                updated = true;
            }
            if (!existing.isActive()) {
                existing.setActive(true);
                updated = true;
            }
            return updated ? departmentRepository.save(existing) : existing;
        }).orElseGet(() -> {
            Department dept = new Department(name, code, description, contact);
            dept.setActive(true);
            Department saved = departmentRepository.save(dept);
            log.info("Department seeded: {} [{}]", name, code);
            return saved;
        });
    }

    private User seedUserIfMissing(String email, String name, String rawPassword, String role, String portal, Long departmentId) {
        return userRepository.findByEmail(email).map(existing -> {
            boolean updated = false;
            if (!passwordEncoder.matches(rawPassword, existing.getPasswordHash())) {
                existing.setPasswordHash(passwordEncoder.encode(rawPassword));
                updated = true;
            }
            if (!role.equalsIgnoreCase(existing.getRole())) {
                existing.setRole(role);
                updated = true;
            }
            if (portal != null && !portal.equalsIgnoreCase(existing.getPortal())) {
                existing.setPortal(portal);
                updated = true;
            }
            if (departmentId != null && !departmentId.equals(existing.getDepartmentId())) {
                existing.setDepartmentId(departmentId);
                updated = true;
            }
            if (!existing.isActive()) {
                existing.setActive(true);
                updated = true;
            }
            if (updated) {
                User saved = userRepository.save(existing);
                log.info("Demo user verified and updated: {} [{}]", email, role);
                return saved;
            }
            return existing;
        }).orElseGet(() -> {
            User user = new User(
                    name,
                    email,
                    passwordEncoder.encode(rawPassword),
                    "9876543210",
                    role,
                    portal
            );
            user.setDepartmentId(departmentId);
            user.setActive(true);
            User saved = userRepository.save(user);
            log.info("Demo user seeded: {} [{}]", email, role);
            return saved;
        });
    }

    private void seedSampleComplaints(User citizen, Department elecDept, Department sanitationDept, Department waterDept) {
        Instant now = Instant.now();

        // 1. Complaint: Submitted (Street Light -> Electricity Dept)
        Complaint c1 = createComplaintEntity(
                "RJCIVIC-JAI-NNG-2026-1001",
                "Broken Street Light Near MI Road",
                "Street light not working for 3 days near MI Road intersection.",
                "street light",
                "Jaipur",
                "Nagar Nigam Jaipur",
                "Ward 12",
                Constants.PRIORITY_NORMAL,
                Constants.STATUS_SUBMITTED,
                citizen,
                elecDept,
                now.minus(2, ChronoUnit.HOURS)
        );
        Complaint saved1 = complaintRepository.save(c1);
        timelineRepository.save(new ComplaintTimeline(
                saved1.getId(),
                Constants.STATUS_SUBMITTED,
                "Grievance Lodged",
                "Complaint successfully registered on RajCivic Connect nodes.",
                citizen.getName(),
                Constants.ROLE_CITIZEN
        ));

        // 2. Complaint: In Progress (Garbage -> Sanitation Dept)
        Complaint c2 = createComplaintEntity(
                "RJCIVIC-JOD-NNG-2026-1002",
                "Overflowing Garbage Bin at Ratanada",
                "Garbage bin is overflowing and blocking the main pathway.",
                "garbage",
                "Jodhpur",
                "Nagar Nigam Jodhpur",
                "Ward 05",
                Constants.PRIORITY_HIGH,
                Constants.STATUS_IN_PROGRESS,
                citizen,
                sanitationDept,
                now.minus(6, ChronoUnit.HOURS)
        );
        Complaint saved2 = complaintRepository.save(c2);
        timelineRepository.save(new ComplaintTimeline(
                saved2.getId(),
                Constants.STATUS_SUBMITTED,
                "Grievance Lodged",
                "Complaint successfully registered on RajCivic Connect nodes.",
                citizen.getName(),
                Constants.ROLE_CITIZEN
        ));
        timelineRepository.save(new ComplaintTimeline(
                saved2.getId(),
                Constants.STATUS_IN_PROGRESS,
                "Status: InProgress",
                "Sanitation team dispatched with garbage collection vehicle.",
                "Officer Sanitation",
                Constants.ROLE_OFFICER
        ));

        // 3. Complaint: Resolved (Water -> Water Dept)
        Complaint c3 = createComplaintEntity(
                "RJCIVIC-UDA-NP-2026-1003",
                "Water Pipeline Leakage at City Palace Road",
                "Main drinking water supply pipeline leaking heavily.",
                "water",
                "Udaipur",
                "Nagar Parishad Udaipur",
                "Ward 08",
                Constants.PRIORITY_CRITICAL,
                Constants.STATUS_RESOLVED,
                citizen,
                waterDept,
                now.minus(12, ChronoUnit.HOURS)
        );
        c3.setResolvedAt(now.minus(1, ChronoUnit.HOURS));
        Complaint saved3 = complaintRepository.save(c3);
        timelineRepository.save(new ComplaintTimeline(
                saved3.getId(),
                Constants.STATUS_SUBMITTED,
                "Grievance Lodged",
                "Complaint successfully registered on RajCivic Connect nodes.",
                citizen.getName(),
                Constants.ROLE_CITIZEN
        ));
        timelineRepository.save(new ComplaintTimeline(
                saved3.getId(),
                Constants.STATUS_IN_PROGRESS,
                "Status: InProgress",
                "Emergency pipeline repair technician assigned.",
                "Officer Water",
                Constants.ROLE_OFFICER
        ));
        timelineRepository.save(new ComplaintTimeline(
                saved3.getId(),
                Constants.STATUS_RESOLVED,
                "Status: Resolved",
                "Pipe joint repaired and water pressure tested normal.",
                "Officer Water",
                Constants.ROLE_OFFICER
        ));

        log.info("3 Demo sample complaints seeded for manual inspection.");
    }

    private Complaint createComplaintEntity(
            String code,
            String title,
            String description,
            String category,
            String district,
            String ulbName,
            String ward,
            String priority,
            String status,
            User citizen,
            Department dept,
            Instant createdAt
    ) {
        SlaCalculator.SlaResult sla = SlaCalculator.calculateSla(priority, false);

        Complaint c = new Complaint();
        c.setComplaintCode(code);
        c.setTitle(title);
        c.setDescription(description);
        c.setCategory(category);
        c.setDistrict(district);
        c.setUlbName(ulbName);
        c.setWardNumber(ward);
        c.setDepartmentId(dept.getId());
        c.setDepartmentName(dept.getName());
        c.setPriority(priority);
        c.setStatus(status);
        c.setSlaHours(sla.slaHours());
        c.setSlaDeadline(sla.slaDeadline());
        c.setCitizenId(citizen.getId());
        c.setCitizenName(citizen.getName());
        c.setCitizenEmail(citizen.getEmail());
        c.setCitizenPhone(citizen.getPhone());
        c.setCreatedAt(createdAt);
        c.setUpdatedAt(createdAt);
        return c;
    }
}
