package com.civicconnect.service;

import com.civicconnect.dto.UpdateStatusRequest;
import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.ComplaintTimelineRepository;
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
    private ComplaintMediaService mediaService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private ComplaintDraftService draftService;

    private ComplaintService complaintService;

    @BeforeEach
    void setUp() {
        complaintService = new ComplaintService(
                complaintRepository,
                timelineRepository,
                mediaService,
                notificationService,
                auditLogService,
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
    void testUpdateClosedComplaintThrows409Conflict() {
        User officer = new User("Officer", "officer@civic.local", "hash", "333", Constants.ROLE_OFFICER, "department");
        officer.setId(3L);

        Complaint closedComplaint = new Complaint();
        closedComplaint.setId(20L);
        closedComplaint.setComplaintCode("RJCIVIC-JAI-NNG-2026-0020");
        closedComplaint.setCitizenId(1L);
        closedComplaint.setStatus(Constants.STATUS_CLOSED);

        when(complaintRepository.findByComplaintCode("RJCIVIC-JAI-NNG-2026-0020")).thenReturn(Optional.of(closedComplaint));

        UpdateStatusRequest updateReq = new UpdateStatusRequest(Constants.STATUS_IN_PROGRESS, "Trying to reopen", null);

        ApiException ex = assertThrows(ApiException.class, () ->
                complaintService.updateStatus("RJCIVIC-JAI-NNG-2026-0020", updateReq, officer)
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertTrue(ex.getMessage().contains("already closed"));
    }
}
