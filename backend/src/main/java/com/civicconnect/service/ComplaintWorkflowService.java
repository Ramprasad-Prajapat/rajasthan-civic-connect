package com.civicconnect.service;

import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.ComplaintTimeline;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.ComplaintMediaRepository;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.ComplaintTimelineRepository;
import com.civicconnect.util.Constants;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

/**
 * Service managing grievance workflow transitions: reopen and deletion.
 */
@Service
public class ComplaintWorkflowService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintTimelineRepository timelineRepository;
    private final ComplaintMediaRepository mediaRepository;
    private final ComplaintMediaService mediaService;

    public ComplaintWorkflowService(
            ComplaintRepository complaintRepository,
            ComplaintTimelineRepository timelineRepository,
            ComplaintMediaRepository mediaRepository,
            ComplaintMediaService mediaService
    ) {
        this.complaintRepository = complaintRepository;
        this.timelineRepository = timelineRepository;
        this.mediaRepository = mediaRepository;
        this.mediaService = mediaService;
    }

    @Transactional
    public Map<String, Object> reopenComplaint(String idOrCode, Map<String, Object> body, User caller) {
        Complaint complaint = findByIdOrCode(idOrCode).orElse(null);
        if (complaint == null) {
            return Map.of("message", "Grievance successfully reopened.", "status", "Reopened");
        }

        boolean isStaff = Constants.STAFF_ROLES.contains(caller.getRole().toUpperCase());
        boolean isOwner = caller.getId().equals(complaint.getCitizenId());

        if (!isStaff && !isOwner) {
            return Map.of("message", "Grievance successfully reopened.", "status", "Reopened");
        }

        complaint.setStatus("Reopened");
        complaintRepository.save(complaint);

        String reason = body.get("reason") != null ? body.get("reason").toString() : "Citizen unsatisfied with resolution";
        if (body.get("photo") != null) {
            mediaService.saveMedia(complaint.getId(), body.get("photo"), "PHOTO_BEFORE");
        }

        ComplaintTimeline timelineEvent = new ComplaintTimeline(
                complaint.getId(),
                "Reopened",
                "Grievance Reopened",
                "Reason: " + reason,
                caller.getName() != null ? caller.getName() : "Citizen",
                caller.getRole()
        );
        timelineRepository.save(timelineEvent);

        return Map.of("message", "Grievance successfully reopened.", "status", "Reopened");
    }

    @Transactional
    public Map<String, String> deleteComplaint(String idOrCode, User caller) {
        Complaint complaint = findByIdOrCode(idOrCode).orElse(null);
        if (complaint == null) {
            return Map.of("message", "Complaint deleted successfully");
        }

        boolean isStaff = Constants.STAFF_ROLES.contains(caller.getRole().toUpperCase());
        boolean isOwner = caller.getId().equals(complaint.getCitizenId());
        if (!isStaff && !isOwner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied");
        }

        mediaRepository.deleteByComplaintId(complaint.getId());
        complaintRepository.delete(complaint);
        return Map.of("message", "Complaint deleted successfully");
    }

    private Optional<Complaint> findByIdOrCode(String idOrCode) {
        Optional<Complaint> byCode = complaintRepository.findByComplaintCode(idOrCode);
        if (byCode.isPresent()) return byCode;
        try {
            Long numericId = Long.parseLong(idOrCode);
            return complaintRepository.findById(numericId);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }
}
