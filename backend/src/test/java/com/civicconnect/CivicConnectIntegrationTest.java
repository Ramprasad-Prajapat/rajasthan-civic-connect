package com.civicconnect;

import com.civicconnect.dto.ChangePasswordRequest;
import com.civicconnect.dto.CreateOfficerRequest;
import com.civicconnect.dto.LoginRequest;
import com.civicconnect.dto.RegisterRequest;
import com.civicconnect.dto.UpdateOfficerRequest;
import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.Department;
import com.civicconnect.entity.User;
import com.civicconnect.repository.*;
import com.civicconnect.util.Constants;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.sql.DataSource;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.util.Base64;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CivicConnectIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private ComplaintRepository complaintRepository;

    @Autowired(required = false)
    private ComplaintTimelineRepository timelineRepository;

    @Autowired(required = false)
    private DepartmentRepository departmentRepository;

    @Autowired(required = false)
    private FeedbackRepository feedbackRepository;

    @Autowired(required = false)
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private ComplaintDraftRepository draftRepository;

    @Autowired(required = false)
    private ComplaintMediaRepository mediaRepository;

    @Autowired(required = false)
    private PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private DataSource dataSource;

    private static boolean dbAvailable = false;

    @BeforeAll
    static void checkDatabaseAvailability() {
        dbAvailable = testPort(3306) || testPort(3307);
    }

    private static boolean testPort(int port) {
        try (Socket socket = new Socket("127.0.0.1", port)) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @BeforeEach
    void assumeDatabaseUp() {
        Assumptions.assumeTrue(dbAvailable, "MySQL is not accessible. Skipping integration tests.");
    }

    @Test
    void test1_DatabaseConnectionAndPool() throws Exception {
        assertNotNull(dataSource, "DataSource bean should be configured");
        try (Connection conn = dataSource.getConnection()) {
            assertTrue(conn.isValid(2), "JDBC Connection to test schema should be valid");
            assertEquals("civic_connect_test", conn.getCatalog(), "Target catalog must be civic_connect_test");
        }
    }

    @Test
    void test2_CitizenRegistrationAndRoleForced() throws Exception {
        String email = "reg_test_" + System.currentTimeMillis() + "@test.local";
        RegisterRequest req = new RegisterRequest("Test Citizen", email, "Password@123", "9876543210", "Admin", "admin");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.role").value(Constants.ROLE_CITIZEN))
                .andReturn();

        User user = userRepository.findByEmail(email).orElseThrow();
        assertEquals("Test Citizen", user.getName());
        assertTrue(passwordEncoder.matches("Password@123", user.getPasswordHash()));
        assertEquals(Constants.ROLE_CITIZEN, user.getRole(), "User role must be forced to Citizen");
    }

    @Test
    void test3_DuplicateRegistrationRejected() throws Exception {
        String email = "dup_" + System.currentTimeMillis() + "@test.local";
        RegisterRequest req = new RegisterRequest("User Dup", email, "Password@123", "1234567890", "Citizen", "citizen");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void test4_OfficerScopingAndIsolation() throws Exception {
        // Create 2 departments
        Department deptA = departmentRepository.save(new Department("Scope Dept A " + System.currentTimeMillis(), "SDA", "Desc A", "a@test.local"));
        Department deptB = departmentRepository.save(new Department("Scope Dept B " + System.currentTimeMillis(), "SDB", "Desc B", "b@test.local"));

        // Create 2 officers in deptA and deptB
        String offAEmail = "offA_" + System.currentTimeMillis() + "@test.local";
        createOfficerUser(offAEmail, "Officer@123", deptA.getId());
        String tokenA = obtainToken(offAEmail, "Officer@123", "department");

        String offBEmail = "offB_" + System.currentTimeMillis() + "@test.local";
        createOfficerUser(offBEmail, "Officer@123", deptB.getId());
        String tokenB = obtainToken(offBEmail, "Officer@123", "department");

        // Citizen creates complaint in deptA
        String citEmail = "citScope_" + System.currentTimeMillis() + "@test.local";
        createCitizenUser(citEmail, "Citizen@123");
        String citToken = obtainToken(citEmail, "Citizen@123", "citizen");

        // Complaint created mapped to deptA
        Complaint compA = new Complaint();
        compA.setComplaintCode("RJCIVIC-TEST-" + System.currentTimeMillis());
        compA.setTitle("Issue in Dept A");
        compA.setCategory("sanitation");
        compA.setDistrict("Jaipur");
        compA.setDepartmentId(deptA.getId());
        compA.setDepartmentName(deptA.getName());
        compA.setPriority(Constants.PRIORITY_NORMAL);
        compA.setStatus(Constants.STATUS_SUBMITTED);
        User citizenUser = userRepository.findByEmail(citEmail).orElseThrow();
        compA.setCitizenId(citizenUser.getId());
        compA = complaintRepository.save(compA);

        // Scenario 1: Officer A sees it, Officer B sees empty / not this complaint
        MvcResult listResA = mockMvc.perform(get("/api/complaints").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();
        assertTrue(listResA.getResponse().getContentAsString().contains(compA.getComplaintCode()), "Officer A must see own department complaint");

        MvcResult listResB = mockMvc.perform(get("/api/complaints").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andReturn();
        assertFalse(listResB.getResponse().getContentAsString().contains(compA.getComplaintCode()), "Officer B must NOT see dept A complaint");

        // Officer A can open detail
        mockMvc.perform(get("/api/complaints/" + compA.getComplaintCode()).header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        // Officer B opening dept A complaint -> 403 Forbidden
        mockMvc.perform(get("/api/complaints/" + compA.getComplaintCode()).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());

        // Officer B updating dept A complaint -> 403 Forbidden
        mockMvc.perform(put("/api/complaints/" + compA.getComplaintCode() + "/status")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "InProgress", "remark", "Unauthorized attempt"))))
                .andExpect(status().isForbidden());

        // Admin sees all
        String adminEmail = "adminScope_" + System.currentTimeMillis() + "@test.local";
        createStaffUser(adminEmail, "Admin@123", Constants.ROLE_ADMIN);
        String adminToken = obtainToken(adminEmail, "Admin@123", "admin");

        MvcResult adminList = mockMvc.perform(get("/api/complaints").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        assertTrue(adminList.getResponse().getContentAsString().contains(compA.getComplaintCode()), "Admin must see all complaints");
    }

    @Test
    void test5_OfficerWithoutDepartmentSeesNothing() throws Exception {
        String offNoDept = "offNoDept_" + System.currentTimeMillis() + "@test.local";
        User user = new User("No Dept Officer", offNoDept, passwordEncoder.encode("Officer@123"), "1112223334", Constants.ROLE_OFFICER, "department");
        user.setDepartmentId(null);
        userRepository.save(user);

        String token = obtainToken(offNoDept, "Officer@123", "department");

        mockMvc.perform(get("/api/complaints").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void test6_AdminCreatesOfficerAndChangesDepartment() throws Exception {
        String adminEmail = "adminMgr_" + System.currentTimeMillis() + "@test.local";
        createStaffUser(adminEmail, "Admin@123", Constants.ROLE_ADMIN);
        String adminToken = obtainToken(adminEmail, "Admin@123", "admin");

        Department dept1 = departmentRepository.save(new Department("Dept One " + System.currentTimeMillis(), "D1", "Desc", "c1@test.local"));
        Department dept2 = departmentRepository.save(new Department("Dept Two " + System.currentTimeMillis(), "D2", "Desc", "c2@test.local"));

        // Admin creates officer
        String newOfficerEmail = ("newOff_" + System.currentTimeMillis() + "@test.local").toLowerCase();
        CreateOfficerRequest createReq = new CreateOfficerRequest("Fresh Officer", newOfficerEmail, "9988776655", "InitialPass@123", dept1.getId());

        mockMvc.perform(post("/api/admin/officers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(newOfficerEmail))
                .andExpect(jsonPath("$.departmentId").value(dept1.getId()));

        // Officer logs in with initial password
        String officerToken = obtainToken(newOfficerEmail, "InitialPass@123", "department");
        assertNotNull(officerToken);

        // Admin updates officer's department to dept2
        User createdUser = userRepository.findByEmail(newOfficerEmail).orElseThrow();
        UpdateOfficerRequest updateReq = new UpdateOfficerRequest(null, null, dept2.getId(), true);

        mockMvc.perform(put("/api/admin/officers/" + createdUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departmentId").value(dept2.getId()));

        User reloaded = userRepository.findById(createdUser.getId()).orElseThrow();
        assertEquals(dept2.getId(), reloaded.getDepartmentId());
    }

    @Test
    void test7_AdminDepartmentManagementAndConflictOnDelete() throws Exception {
        String adminEmail = "adminDept_" + System.currentTimeMillis() + "@test.local";
        createStaffUser(adminEmail, "Admin@123", Constants.ROLE_ADMIN);
        String adminToken = obtainToken(adminEmail, "Admin@123", "admin");

        // 1. Create department
        String deptName = "Dept Protect " + System.currentTimeMillis();
        MvcResult createRes = mockMvc.perform(post("/api/departments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", deptName, "code", "DP", "description", "Protected dept", "contact", "dept@test.local"))))
                .andExpect(status().isCreated())
                .andReturn();
        Long deptId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asLong();

        // 2. Attach a complaint to it
        Complaint complaint = new Complaint();
        complaint.setComplaintCode("RJCIVIC-PROT-" + System.currentTimeMillis());
        complaint.setTitle("Grievance for dept");
        complaint.setCategory("sanitation");
        complaint.setDepartmentId(deptId);
        complaint.setDepartmentName(deptName);
        complaint.setPriority(Constants.PRIORITY_NORMAL);
        complaint.setStatus(Constants.STATUS_SUBMITTED);
        complaint.setCitizenId(1L);
        complaintRepository.save(complaint);

        // 3. Deleting department that has complaints -> 409 Conflict
        mockMvc.perform(delete("/api/departments/" + deptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("deactivate instead")));

        // 4. Toggle active -> false
        mockMvc.perform(put("/api/departments/" + deptId + "/active")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("active", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void test8_AdminReassignsComplaintDepartmentWithTimeline() throws Exception {
        String adminEmail = "adminReassign_" + System.currentTimeMillis() + "@test.local";
        createStaffUser(adminEmail, "Admin@123", Constants.ROLE_ADMIN);
        String adminToken = obtainToken(adminEmail, "Admin@123", "admin");

        Department deptOrigin = departmentRepository.save(new Department("Origin " + System.currentTimeMillis(), "ORIG", "Origin", "o@test.local"));
        Department deptTarget = departmentRepository.save(new Department("Target " + System.currentTimeMillis(), "TARG", "Target", "t@test.local"));

        Complaint comp = new Complaint();
        comp.setComplaintCode("RJCIVIC-REASSIGN-" + System.currentTimeMillis());
        comp.setTitle("Reassign Test Grievance");
        comp.setCategory("water");
        comp.setDepartmentId(deptOrigin.getId());
        comp.setDepartmentName(deptOrigin.getName());
        comp.setPriority(Constants.PRIORITY_NORMAL);
        comp.setStatus(Constants.STATUS_SUBMITTED);
        comp.setCitizenId(1L);
        comp = complaintRepository.save(comp);

        mockMvc.perform(put("/api/complaints/" + comp.getComplaintCode() + "/department")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("departmentId", deptTarget.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departmentId").value(String.valueOf(deptTarget.getId())));

        Complaint updated = complaintRepository.findByComplaintCode(comp.getComplaintCode()).orElseThrow();
        assertEquals(deptTarget.getId(), updated.getDepartmentId());

        assertFalse(timelineRepository.findByComplaintIdOrderByCreatedAtAsc(updated.getId()).isEmpty(),
                "Timeline row must be recorded for department reassignment");
    }

    @Test
    void test9_DeactivatedUserLoginAndTokenRejection() throws Exception {
        String email = "deact_" + System.currentTimeMillis() + "@test.local";
        User user = new User("Deactivated User", email, passwordEncoder.encode("Password@123"), "1231231234", Constants.ROLE_CITIZEN, "citizen");
        user.setActive(true);
        user = userRepository.save(user);

        // Obtain valid token
        String token = obtainToken(email, "Password@123", "citizen");

        // Deactivate user in database
        user.setActive(false);
        userRepository.save(user);

        // 1. Login attempt -> 403 Forbidden
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, "Password@123", "citizen"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Account is disabled"));

        // 2. Existing token rejected immediately on protected request -> 403 Forbidden
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("disabled")));
    }

    @Test
    void test10_ChangePasswordFlow() throws Exception {
        String email = "pwdChange_" + System.currentTimeMillis() + "@test.local";
        createCitizenUser(email, "OldPassword@123");
        String token = obtainToken(email, "OldPassword@123", "citizen");

        // 1. Wrong current password -> 400 Bad Request
        ChangePasswordRequest wrongReq = new ChangePasswordRequest("WrongPass@123", "NewPassword@123");
        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Invalid current password")));

        // 2. Success with correct current password
        ChangePasswordRequest validReq = new ChangePasswordRequest("OldPassword@123", "NewPassword@123");
        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("successfully")));

        // 3. Login with new password works
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, "NewPassword@123", "citizen"))))
                .andExpect(status().isOk());

        // 4. Login with old password fails
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, "OldPassword@123", "citizen"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test11_StatsEndpoints() throws Exception {
        String adminEmail = "statsAdmin_" + System.currentTimeMillis() + "@test.local";
        createStaffUser(adminEmail, "Admin@123", Constants.ROLE_ADMIN);
        String adminToken = obtainToken(adminEmail, "Admin@123", "admin");

        Department dept = departmentRepository.save(new Department("Stats Dept " + System.currentTimeMillis(), "ST", "Desc", "st@test.local"));
        String offEmail = "statsOff_" + System.currentTimeMillis() + "@test.local";
        createOfficerUser(offEmail, "Officer@123", dept.getId());
        String officerToken = obtainToken(offEmail, "Officer@123", "department");

        // Admin stats returns numbers from MySQL
        mockMvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalComplaints").isNumber())
                .andExpect(jsonPath("$.totalDepartments").isNumber())
                .andExpect(jsonPath("$.totalOfficers").isNumber())
                .andExpect(jsonPath("$.totalCitizens").isNumber());

        // Officer department stats
        mockMvc.perform(get("/api/department/stats").header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departmentId").value(dept.getId()))
                .andExpect(jsonPath("$.total").isNumber())
                .andExpect(jsonPath("$.submitted").isNumber())
                .andExpect(jsonPath("$.inProgress").isNumber())
                .andExpect(jsonPath("$.resolved").isNumber())
                .andExpect(jsonPath("$.overdue").isNumber());
    }

    @Test
    void test12_AccessControlAndRemovedEndpointsAre404() throws Exception {
        String citEmail = "citSec_" + System.currentTimeMillis() + "@test.local";
        createCitizenUser(citEmail, "Citizen@123");
        String citToken = obtainToken(citEmail, "Citizen@123", "citizen");

        String adminEmail = "adminSec_" + System.currentTimeMillis() + "@test.local";
        createStaffUser(adminEmail, "Admin@123", Constants.ROLE_ADMIN);
        String adminToken = obtainToken(adminEmail, "Admin@123", "admin");

        // Citizen calling officer/admin endpoints -> 403 Forbidden
        mockMvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + citToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/officers").header("Authorization", "Bearer " + citToken))
                .andExpect(status().isForbidden());

        // Unauthenticated call -> 401 Unauthorized
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized());

        // Removed endpoints return 404 Not Found even for authenticated Admin
        mockMvc.perform(get("/api/emergencies").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/workers").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/audit-logs").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/reports").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void test13_PersistencePerFeature() throws Exception {
        String citEmail = "persCit_" + System.currentTimeMillis() + "@test.local";
        createCitizenUser(citEmail, "Citizen@123");
        String citToken = obtainToken(citEmail, "Citizen@123", "citizen");
        User citUser = userRepository.findByEmail(citEmail).orElseThrow();

        // Draft persistence
        mockMvc.perform(post("/api/complaints/draft")
                        .header("Authorization", "Bearer " + citToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"category\":\"sanitation\",\"title\":\"Draft Title\"}"))
                .andExpect(status().isOk());
        assertTrue(draftRepository.findByUserId(citUser.getId()).isPresent(), "Draft must persist in MySQL");

        // Complaint + photo media persistence
        String compPayload = """
                {
                    "title": "Photo test issue",
                    "category": "road",
                    "district": "Jaipur",
                    "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP=="
                }
                """;
        MvcResult compRes = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + citToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(compPayload))
                .andExpect(status().isCreated())
                .andReturn();
        String code = objectMapper.readTree(compRes.getResponse().getContentAsString()).get("complaintId").asText();
        Complaint comp = complaintRepository.findByComplaintCode(code).orElseThrow();
        assertFalse(mediaRepository.findByComplaintIdOrderByCreatedAtAsc(comp.getId()).isEmpty(), "Photo media must persist in MySQL");

        // Feedback persistence
        mockMvc.perform(post("/api/feedback")
                        .header("Authorization", "Bearer " + citToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("complaintId", code, "rating", 5, "comment", "Great work"))))
                .andExpect(status().isOk());
        assertTrue(feedbackRepository.existsByComplaintIdAndUserId(code, citUser.getId()), "Feedback must persist in MySQL");

        // Notifications persistence
        assertFalse(notificationRepository.findByUserIdOrderByCreatedAtDesc(citUser.getId()).isEmpty(), "Notification must persist in MySQL");
    }

    @Test
    void test14_CorsPreflightAndAllowedOrigin() throws Exception {
        mockMvc.perform(options("/api/complaints")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Content-Type, Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));

        mockMvc.perform(options("/api/departments")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void test15_UnauthenticatedRoutesReturn401Sweep() throws Exception {
        String[] protectedGetRoutes = {
                "/api/complaints",
                "/api/complaints/my",
                "/api/complaints/draft",
                "/api/admin/stats",
                "/api/admin/officers",
                "/api/admin/users",
                "/api/department/stats",
                "/api/departments/my/stats",
                "/api/auth/me",
                "/api/notifications"
        };

        for (String route : protectedGetRoutes) {
            mockMvc.perform(get(route))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("Unauthorized: Invalid or missing token"));
        }
    }

    @Test
    void test16_CompleteComplaintLifecycleWithPhotoAndTimelineAndNotification() throws Exception {
        // Ensure Water Department exists
        Department waterDept = departmentRepository.findByNameIgnoreCase("Water Department")
                .orElseGet(() -> departmentRepository.save(new Department("Water Department", "WTR", "Water supply and maintenance", "0141-222222")));

        String citizenEmail = "lifecycle_cit_" + System.currentTimeMillis() + "@test.local";

        // 1. Citizen registration
        RegisterRequest regReq = new RegisterRequest("Lifecycle Citizen", citizenEmail, "Password@123", "9876543210", "Citizen", "citizen");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.role").value(Constants.ROLE_CITIZEN))
                .andReturn();
        String citToken = objectMapper.readTree(regRes.getResponse().getContentAsString()).get("token").asText();

        // 2. Citizen login
        String loginToken = obtainToken(citizenEmail, "Password@123", "citizen");
        assertNotNull(loginToken);

        // 3. Citizen creates complaint with photo
        String photoBase64 = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString("photo-evidence-test".getBytes(StandardCharsets.UTF_8));
        Map<String, Object> compReq = Map.of(
                "title", "Lifecycle Water Pipe Burst",
                "description", "Water leakage on street road",
                "category", "water",
                "district", "Jaipur",
                "ulbName", "Nagar Nigam Jaipur",
                "priority", "High",
                "photo", photoBase64
        );
        MvcResult compRes = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + citToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(compReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.complaintId").isString())
                .andExpect(jsonPath("$.departmentName").value("Water Department"))
                .andReturn();

        JsonNode compNode = objectMapper.readTree(compRes.getResponse().getContentAsString());
        String ticketCode = compNode.get("complaintId").asText();
        Long compId = compNode.get("id").asLong();
        Long deptId = compNode.get("departmentId").asLong();

        // Verify photo persisted in complaint_media
        assertFalse(mediaRepository.findByComplaintIdOrderByCreatedAtAsc(compId).isEmpty(), "Media photo must persist");

        // 4. Officer of matching department logs in and sees complaint
        String offEmail = "water_off_" + System.currentTimeMillis() + "@test.local";
        createOfficerUser(offEmail, "Officer@123", deptId);
        String officerToken = obtainToken(offEmail, "Officer@123", "department");

        mockMvc.perform(get("/api/complaints").header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.complaintId == '" + ticketCode + "')]").exists());

        // 5. Officer updates status to InProgress with remark
        mockMvc.perform(put("/api/complaints/" + ticketCode + "/status")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "InProgress", "remark", "Team dispatched"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("InProgress"));

        // 6. Check timeline events (Submitted + InProgress)
        Complaint complaintFromDb = complaintRepository.findByComplaintCode(ticketCode).orElseThrow();
        assertEquals("InProgress", complaintFromDb.getStatus());
        assertTrue(timelineRepository.findByComplaintIdOrderByCreatedAtAsc(compId).size() >= 2, "Timeline must log both events");

        // 7. Check citizen notification created
        User citizenUser = userRepository.findByEmail(citizenEmail).orElseThrow();
        assertFalse(notificationRepository.findByUserIdOrderByCreatedAtDesc(citizenUser.getId()).isEmpty(), "Citizen must receive notification");
    }

    @Test
    void testConcurrentComplaintCreationUniqueCodesNo500() throws Exception {
        if (departmentRepository != null && departmentRepository.findByNameIgnoreCase("Water Supply and Sewerage Board").isEmpty()) {
            departmentRepository.save(new Department("Water Supply and Sewerage Board", "WAT", "Water Supply and Drainage", "0141-2222222"));
        }
        String citizenEmail = "concurrent_citizen_" + System.currentTimeMillis() + "@civic.local";
        createCitizenUser(citizenEmail, "Citizen@123");
        String token = obtainToken(citizenEmail, "Citizen@123", "citizen");

        int threadCount = 30;
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(10);
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(1);
        java.util.List<java.util.concurrent.Future<MvcResult>> futures = new java.util.ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            futures.add(executor.submit(() -> {
                latch.await();
                Map<String, Object> req = Map.of(
                        "title", "Parallel Issue " + index,
                        "description", "Concurrency test burst submission " + index,
                        "category", "Water",
                        "district", "Jaipur",
                        "ulbName", "Nagar Nigam Jaipur"
                );
                return mockMvc.perform(post("/api/complaints")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                        .andReturn();
            }));
        }

        latch.countDown();
        executor.shutdown();
        assertTrue(executor.awaitTermination(60, java.util.concurrent.TimeUnit.SECONDS));

        java.util.Set<String> uniqueCodes = java.util.Collections.synchronizedSet(new java.util.HashSet<>());
        for (java.util.concurrent.Future<MvcResult> f : futures) {
            MvcResult res = f.get();
            int statusCode = res.getResponse().getStatus();
            assertNotEquals(500, statusCode, "Concurrent complaint submission must never produce 500 server error: " + res.getResponse().getContentAsString());
            assertEquals(201, statusCode, "Expected 201 Created for concurrent submission: " + res.getResponse().getContentAsString());
            JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
            String code = json.has("complaintId") ? json.get("complaintId").asText() : json.path("data").get("complaintId").asText();
            assertNotNull(code);
            assertFalse(code.startsWith("TMP-"), "Complaint code must not be temporary placeholder");
            uniqueCodes.add(code);
        }

        assertEquals(threadCount, uniqueCodes.size(), "All " + threadCount + " generated complaint codes must be unique");
    }

    private String obtainToken(String email, String password, String portal) throws Exception {
        LoginRequest req = new LoginRequest(email, password, portal != null ? portal : "citizen");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        return json.get("token").asText();
    }

    private void createStaffUser(String email, String password, String role) {
        User user = new User("Staff User", email, passwordEncoder.encode(password), "0000000000", role, "admin");
        user.setActive(true);
        userRepository.save(user);
    }

    private void createOfficerUser(String email, String password, Long departmentId) {
        User user = new User("Department Officer", email, passwordEncoder.encode(password), "1111111111", Constants.ROLE_OFFICER, "department");
        user.setDepartmentId(departmentId);
        user.setActive(true);
        userRepository.save(user);
    }

    private void createCitizenUser(String email, String password) {
        User user = new User("Citizen User", email, passwordEncoder.encode(password), "2222222222", Constants.ROLE_CITIZEN, "citizen");
        user.setActive(true);
        userRepository.save(user);
    }
}
