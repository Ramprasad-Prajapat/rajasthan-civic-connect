package com.civicconnect.service;

import com.civicconnect.dto.UpdateStatusRequest;
import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.ComplaintTimelineRepository;
import com.civicconnect.repository.DepartmentRepository;
import com.civicconnect.repository.UserRepository;
import com.civicconnect.util.Constants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private ComplaintTimelineRepository timelineRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ComplaintMediaService mediaService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ComplaintDraftService draftService;

    private ComplaintService complaintService;

    @BeforeEach
    void setUp() {
        complaintService = new ComplaintService(
                complaintRepository,
                timelineRepository,
                departmentRepository,
                userRepository,
                mediaService,
                notificationService,
                draftService
        );
    }

    @Test
    void testCitizenBOpeningCitizenAComplaintThrows403Forbidden() {
        User citizenA = new User("Citizen A", "a@example.com", "hash", "111", Constants.ROLE_CITIZEN, "citizen");
        citizenA.setId(1L);

        User citizenB = new User("Citizen B", "b@example.com", "hash", "222", Constants.ROLE_CITIZEN, "citizen");
        citizenB.setId(2L);

        Complaint complaintA = new Complaint();
        complaintA.setId(10L);
        complaintA.setComplaintCode("RJCIVIC-JAI-NNG-2026-0001");
        complaintA.setCitizenId(1L);
        complaintA.setStatus(Constants.STATUS_SUBMITTED);

        when(complaintRepository.findByComplaintCode("RJCIVIC-JAI-NNG-2026-0001")).thenReturn(Optional.of(complaintA));

        ApiException ex = assertThrows(ApiException.class, () ->
                complaintService.getComplaintDetail("RJCIVIC-JAI-NNG-2026-0001", citizenB)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertTrue(ex.getMessage().contains("cannot view another user's complaint"));
    }

    @Test
    void testOfficerOpeningOtherDepartmentComplaintThrows403Forbidden() {
        User waterOfficer = new User("Water Officer", "water@civic.local", "hash", "333", Constants.ROLE_OFFICER, "department");
        waterOfficer.setId(3L);
        waterOfficer.setDepartmentId(100L);

        Complaint sanitationComplaint = new Complaint();
        sanitationComplaint.setId(20L);
        sanitationComplaint.setComplaintCode("RJCIVIC-JAI-NNG-2026-0020");
        sanitationComplaint.setCitizenId(1L);
        sanitationComplaint.setDepartmentId(200L); // different department
        sanitationComplaint.setStatus(Constants.STATUS_SUBMITTED);

        when(complaintRepository.findByComplaintCode("RJCIVIC-JAI-NNG-2026-0020")).thenReturn(Optional.of(sanitationComplaint));

        ApiException ex = assertThrows(ApiException.class, () ->
                complaintService.getComplaintDetail("RJCIVIC-JAI-NNG-2026-0020", waterOfficer)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertTrue(ex.getMessage().contains("another department"));
    }

    @Test
    void testUpdateClosedComplaintThrows409Conflict() {
        User officer = new User("Officer", "officer@civic.local", "hash", "333", Constants.ROLE_OFFICER, "department");
        officer.setId(3L);
        officer.setDepartmentId(100L);

        Complaint closedComplaint = new Complaint();
        closedComplaint.setId(20L);
        closedComplaint.setComplaintCode("RJCIVIC-JAI-NNG-2026-0020");
        closedComplaint.setCitizenId(1L);
        closedComplaint.setDepartmentId(100L);
        closedComplaint.setStatus(Constants.STATUS_CLOSED);

        when(complaintRepository.findByComplaintCode("RJCIVIC-JAI-NNG-2026-0020")).thenReturn(Optional.of(closedComplaint));

        UpdateStatusRequest updateReq = new UpdateStatusRequest(Constants.STATUS_IN_PROGRESS, "Trying to reopen", null);

        ApiException ex = assertThrows(ApiException.class, () ->
                complaintService.updateStatus("RJCIVIC-JAI-NNG-2026-0020", updateReq, officer)
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void testAssignOfficerSuccess() {
        User admin = new User("Admin", "admin@civic.local", "hash", "1234567890", Constants.ROLE_ADMIN, "admin");
        admin.setId(99L);

        User officer = new User("Water Officer", "water@civic.local", "hash", "9876543210", Constants.ROLE_OFFICER, "department");
        officer.setId(5L);
        officer.setDepartmentId(1L);

        Complaint complaint = new Complaint();
        complaint.setId(30L);
        complaint.setComplaintCode("RJCIVIC-JAI-NNG-2026-0030");
        complaint.setDepartmentId(1L);
        complaint.setStatus(Constants.STATUS_SUBMITTED);

        when(complaintRepository.findByComplaintCode("RJCIVIC-JAI-NNG-2026-0030")).thenReturn(Optional.of(complaint));
        when(userRepository.findById(5L)).thenReturn(Optional.of(officer));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = complaintService.assignOfficer("RJCIVIC-JAI-NNG-2026-0030", 5L, admin);

        assertNotNull(response);
        assertEquals("5", response.assignedOfficerId());
        assertEquals("Water Officer", response.assignedOfficerName());
        verify(complaintRepository).save(complaint);
    }

    @Test
    void testAssignOfficerWrongDepartmentThrowsBadRequest() {
        User admin = new User("Admin", "admin@civic.local", "hash", "1234567890", Constants.ROLE_ADMIN, "admin");
        admin.setId(99L);

        User wrongDeptOfficer = new User("Sanitation Officer", "san@civic.local", "hash", "9876543211", Constants.ROLE_OFFICER, "department");
        wrongDeptOfficer.setId(6L);
        wrongDeptOfficer.setDepartmentId(2L); // Different department

        Complaint complaint = new Complaint();
        complaint.setId(31L);
        complaint.setComplaintCode("RJCIVIC-JAI-NNG-2026-0031");
        complaint.setDepartmentId(1L); // Water department

        when(complaintRepository.findByComplaintCode("RJCIVIC-JAI-NNG-2026-0031")).thenReturn(Optional.of(complaint));
        when(userRepository.findById(6L)).thenReturn(Optional.of(wrongDeptOfficer));

        ApiException ex = assertThrows(ApiException.class, () ->
                complaintService.assignOfficer("RJCIVIC-JAI-NNG-2026-0031", 6L, admin)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("department"));
    }

    @Test
    void testAssignOfficerNonAdminThrowsForbidden() {
        User citizen = new User("Citizen", "cit@civic.local", "hash", "1234567890", Constants.ROLE_CITIZEN, "citizen");
        citizen.setId(10L);

        ApiException ex = assertThrows(ApiException.class, () ->
                complaintService.assignOfficer("RJCIVIC-JAI-NNG-2026-0032", 5L, citizen)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }
}
