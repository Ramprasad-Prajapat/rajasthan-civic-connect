package com.civicconnect.config;

import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.ComplaintTimeline;
import com.civicconnect.entity.User;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.ComplaintTimelineRepository;
import com.civicconnect.repository.UserRepository;
import com.civicconnect.util.Constants;
import com.civicconnect.util.DepartmentMapper;
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
 * Seeds demo accounts and initial complaints at startup if app.seed-demo-users=true.
 * Idempotent: checks for existence before adding rows.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final ComplaintTimelineRepository timelineRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed-demo-users:false}")
    private boolean seedDemoUsers;

    public DataSeeder(
            UserRepository userRepository,
            ComplaintRepository complaintRepository,
            ComplaintTimelineRepository timelineRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
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

        User citizen = seedUserIfMissing("citizen@civic.local", "Demo Citizen", "Citizen@123", Constants.ROLE_CITIZEN, "citizen");
        seedUserIfMissing("officer@civic.local", "Municipal Officer", "Officer@123", Constants.ROLE_OFFICER, "department");
        seedUserIfMissing("admin@civic.local", "System Administrator", "Admin@123", Constants.ROLE_ADMIN, "admin");

        if (complaintRepository.count() == 0 && citizen != null) {
            seedSampleComplaints(citizen);
        }
    }

    private User seedUserIfMissing(String email, String name, String rawPassword, String role, String portal) {
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
            User saved = userRepository.save(user);
            log.info("Demo user seeded: {} [{}]", email, role);
            return saved;
        });
    }

    private void seedSampleComplaints(User citizen) {
        Instant now = Instant.now();

        // 1. Complaint: Submitted (Street Light)
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

        // 2. Complaint: In Progress (Garbage)
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
                "Municipal Officer",
                Constants.ROLE_OFFICER
        ));

        // 3. Complaint: Resolved (Water)
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
                "Municipal Officer",
                Constants.ROLE_OFFICER
        ));
        timelineRepository.save(new ComplaintTimeline(
                saved3.getId(),
                Constants.STATUS_RESOLVED,
                "Status: Resolved",
                "Pipe joint repaired and water pressure tested normal.",
                "Municipal Officer",
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
            Instant createdAt
    ) {
        String dept = DepartmentMapper.mapCategoryToDepartment(category);
        SlaCalculator.SlaResult sla = SlaCalculator.calculateSla(priority, false);

        Complaint c = new Complaint();
        c.setComplaintCode(code);
        c.setTitle(title);
        c.setDescription(description);
        c.setCategory(category);
        c.setDistrict(district);
        c.setUlbName(ulbName);
        c.setWardNumber(ward);
        c.setDepartmentId(dept.replaceAll("\\s+", "_"));
        c.setDepartmentName(dept);
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
