package com.civicconnect;

import com.civicconnect.dto.LoginRequest;
import com.civicconnect.dto.RegisterRequest;
import com.civicconnect.entity.Complaint;
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
import java.sql.Connection;
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
    private EmergencyRepository emergencyRepository;

    @Autowired(required = false)
    private FeedbackRepository feedbackRepository;

    @Autowired(required = false)
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private AuditLogRepository auditLogRepository;

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
        dbAvailable = testPort(3307) || testPort(3306);
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
    void test2_CitizenRegistration() throws Exception {
        String email = "reg_test_" + System.currentTimeMillis() + "@test.local";
        RegisterRequest req = new RegisterRequest("Test Citizen", email, "Password@123", "9876543210", "Citizen", "citizen");

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
        assertFalse(user.getPasswordHash().contains("Password@123"), "Password must be BCrypt hashed");
    }

    @Test
    void test3_RoleForcedToCitizen() throws Exception {
        String email = "hacker_" + System.currentTimeMillis() + "@test.local";
        RegisterRequest req = new RegisterRequest("Attacker", email, "Password@123", "9999999999", "Admin", "admin");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value(Constants.ROLE_CITIZEN));

        User user = userRepository.findByEmail(email).orElseThrow();
        assertEquals(Constants.ROLE_CITIZEN, user.getRole(), "User role must be forced to Citizen");
    }

    @Test
    void test4_DuplicateRegistrationRejected() throws Exception {
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
    void test5_CitizenLogin() throws Exception {
        String email = "login_test_" + System.currentTimeMillis() + "@test.local";
        RegisterRequest regReq = new RegisterRequest("Login User", email, "Password@123", "5555555555", "Citizen", "citizen");
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(regReq)));

        LoginRequest loginReq = new LoginRequest(email, "Password@123", "citizen");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value(email));

        LoginRequest badReq = new LoginRequest(email, "WrongPassword", "citizen");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test6_ComplaintLifecycleAndSla() throws Exception {
        String email = "complaint_owner_" + System.currentTimeMillis() + "@test.local";
        RegisterRequest regReq = new RegisterRequest("Owner Citizen", email, "Password@123", "1231231234", "Citizen", "citizen");
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(regReq)));

        String token = obtainToken(email, "Password@123");

        String payload = """
                {
                    "title": "Broken street light",
                    "description": "Street light flickering all night",
                    "category": "electrical",
                    "district": "Jaipur",
                    "ulbName": "Nagar Nigam Heritage",
                    "priority": "Normal",
                    "isEmergency": false
                }
                """;

        MvcResult result = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.complaintId").isString())
                .andExpect(jsonPath("$.departmentName").value("Electrical Department"))
                .andExpect(jsonPath("$.slaHours").value(48))
                .andExpect(jsonPath("$.status").value(Constants.STATUS_SUBMITTED))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        String complaintCode = json.get("complaintId").asText();
        assertTrue(complaintCode.startsWith("RJCIVIC-JAI-NN"), "Prefix format mismatch: " + complaintCode);

        Complaint complaint = complaintRepository.findByComplaintCode(complaintCode).orElseThrow();
        assertEquals("Electrical Department", complaint.getDepartmentName());
        assertEquals(48, complaint.getSlaHours());
        assertNotNull(complaint.getSlaDeadline());

        assertEquals(1, timelineRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId()).size(),
                "Initial timeline event must be logged");
    }

    @Test
    void test7_ComplaintIsolationBetweenCitizens() throws Exception {
        String emailA = "userA_" + System.currentTimeMillis() + "@test.local";
        String emailB = "userB_" + System.currentTimeMillis() + "@test.local";

        RegisterRequest regA = new RegisterRequest("Citizen A", emailA, "Password@123", "111", "Citizen", "citizen");
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(regA)));
        String tokenA = obtainToken(emailA, "Password@123");

        RegisterRequest regB = new RegisterRequest("Citizen B", emailB, "Password@123", "222", "Citizen", "citizen");
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(regB)));
        String tokenB = obtainToken(emailB, "Password@123");

        MvcResult compRes = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("category", "water", "district", "JAI"))))
                .andReturn();
        String code = objectMapper.readTree(compRes.getResponse().getContentAsString()).get("complaintId").asText();

        mockMvc.perform(get("/api/complaints/" + code).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/complaints/" + code).header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());
    }

    @Test
    void test8_StatusUpdateRules() throws Exception {
        String emailA = "usrA_" + System.currentTimeMillis() + "@test.local";
        RegisterRequest regA = new RegisterRequest("Citizen A", emailA, "Password@123", "111", "Citizen", "citizen");
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(regA)));
        String tokenA = obtainToken(emailA, "Password@123");

        String offEmail = "off_" + System.currentTimeMillis() + "@test.local";
        createStaffUser(offEmail, "Officer@123", Constants.ROLE_OFFICER);
        String officerToken = obtainToken(offEmail, "Officer@123");

        MvcResult compRes = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("category", "water", "district", "JAI"))))
                .andReturn();
        String code = objectMapper.readTree(compRes.getResponse().getContentAsString()).get("complaintId").asText();

        mockMvc.perform(put("/api/complaints/" + code + "/status")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "Resolved"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/complaints/" + code + "/status")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "Closed"))))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/complaints/" + code + "/status")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "InProgress"))))
                .andExpect(status().isConflict());
    }

    @Test
    void test9_StubAndUnsupportedRoutes() throws Exception {
        mockMvc.perform(post("/api/auth/sync-user").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isNotImplemented());

        mockMvc.perform(post("/api/auth/forgot-password-verify").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isNotImplemented());

        mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isNotImplemented());
    }

    @Test
    void test10_UnauthenticatedRouteSecurity() throws Exception {
        mockMvc.perform(get("/api/complaints"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/api/complaints/my"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/emergencies"))
                .andExpect(status().isUnauthorized());

        // Public emergency SOS is permitted without token
        mockMvc.perform(post("/api/emergencies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"Medical\",\"description\":\"Accident report\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void test11_PersistencePerFeature() throws Exception {
        String adminEmail = "admin_" + System.currentTimeMillis() + "@test.local";
        createStaffUser(adminEmail, "Admin@123", Constants.ROLE_ADMIN);
        String adminToken = obtainToken(adminEmail, "Admin@123");

        String citizenEmail = "cit_" + System.currentTimeMillis() + "@test.local";
        RegisterRequest regCit = new RegisterRequest("Test Cit", citizenEmail, "Password@123", "999", "Citizen", "citizen");
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(regCit)));
        String citizenToken = obtainToken(citizenEmail, "Password@123");

        // 1. Department persistence
        String deptName = "Test Dept " + System.currentTimeMillis();
        mockMvc.perform(post("/api/departments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", deptName, "officer", "Officer Test"))))
                .andExpect(status().isCreated());
        assertTrue(departmentRepository.existsByName(deptName), "Department must persist in MySQL");

        // 2. Draft persistence
        mockMvc.perform(post("/api/complaints/draft")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"category\":\"sanitation\",\"title\":\"Draft Title\"}"))
                .andExpect(status().isOk());
        User citUser = userRepository.findByEmail(citizenEmail).orElseThrow();
        assertTrue(draftRepository.findByUserId(citUser.getId()).isPresent(), "Draft must persist in MySQL");

        // 3. Media persistence in complaint
        String compPayload = """
                {
                    "title": "Photo test issue",
                    "category": "road",
                    "district": "Jaipur",
                    "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP=="
                }
                """;
        MvcResult compRes = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(compPayload))
                .andExpect(status().isCreated())
                .andReturn();
        String code = objectMapper.readTree(compRes.getResponse().getContentAsString()).get("complaintId").asText();
        Complaint comp = complaintRepository.findByComplaintCode(code).orElseThrow();
        assertFalse(mediaRepository.findByComplaintIdOrderByCreatedAtAsc(comp.getId()).isEmpty(), "Photo media must persist in MySQL");

        // 4. Feedback persistence
        mockMvc.perform(post("/api/feedback")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("complaintId", code, "rating", 5, "comment", "Great work"))))
                .andExpect(status().isOk());
        assertTrue(feedbackRepository.existsByComplaintIdAndUserId(code, citUser.getId()), "Feedback must persist in MySQL");

        // 5. Notifications and Audit logs created
        assertFalse(notificationRepository.findByUserIdOrderByCreatedAtDesc(citUser.getId()).isEmpty(), "Notification must persist in MySQL");
        assertFalse(auditLogRepository.findTop100ByOrderByCreatedAtDesc().isEmpty(), "Audit log must persist in MySQL");
    }

    private String obtainToken(String email, String password) throws Exception {
        LoginRequest req = new LoginRequest(email, password, "citizen");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        return json.get("token").asText();
    }

    private void createStaffUser(String email, String password, String role) {
        User user = new User("Staff Officer", email, passwordEncoder.encode(password), "0000000000", role, "department");
        userRepository.save(user);
    }
}
