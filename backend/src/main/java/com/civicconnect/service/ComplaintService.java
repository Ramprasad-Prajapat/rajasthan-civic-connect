package com.civicconnect.service;

import com.civicconnect.dto.ComplaintResponse;
import com.civicconnect.dto.CreateComplaintRequest;
import com.civicconnect.dto.TimelineResponse;
import com.civicconnect.dto.UpdateStatusRequest;
import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.ComplaintTimeline;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.ComplaintTimelineRepository;
import com.civicconnect.util.ComplaintCodeGenerator;
import com.civicconnect.util.Constants;
import com.civicconnect.util.DepartmentMapper;
import com.civicconnect.util.SlaCalculator;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service orchestrating core grievance ticket creation, listing, SLA calculations, and status transitions.
 */
@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintTimelineRepository timelineRepository;
    private final ComplaintMediaService mediaService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final ComplaintDraftService draftService;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            ComplaintTimelineRepository timelineRepository,
            ComplaintMediaService mediaService,
            NotificationService notificationService,
            AuditLogService auditLogService,
            ComplaintDraftService draftService
    ) {
        this.complaintRepository = complaintRepository;
        this.timelineRepository = timelineRepository;
        this.mediaService = mediaService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.draftService = draftService;
    }

    @Transactional
    public ComplaintResponse createComplaint(CreateComplaintRequest request, User citizen) {
        boolean isEmergency = Boolean.TRUE.equals(request.isEmergency());
        String priority = isEmergency ? Constants.PRIORITY_CRITICAL :
                (request.priority() != null && !request.priority().isBlank() ? request.priority() : Constants.PRIORITY_NORMAL);

        String departmentName = DepartmentMapper.mapCategoryToDepartment(request.category());
        SlaCalculator.SlaResult sla = SlaCalculator.calculateSla(priority, isEmergency);
        String prefix = ComplaintCodeGenerator.generatePrefix(request.district(), request.ulbName(), isEmergency);

        Complaint savedComplaint = null;
        int maxRetries = 5;

        for (int attempt = 0; attempt < maxRetries; attempt++) {
            long nextSeq = resolveNextSequence(prefix) + attempt;
            String ticketCode = ComplaintCodeGenerator.formatCode(prefix, nextSeq);

            Complaint complaint = new Complaint();
            complaint.setComplaintCode(ticketCode);
            complaint.setTitle(request.title() != null && !request.title().isBlank() ? request.title() : "Civic Issue");
            complaint.setDescription(request.description() != null ? request.description() : "");
            complaint.setCategory(request.category());
            complaint.setSubCategory(request.subCategory());

            complaint.setDistrict(request.district());
            complaint.setUlbType(request.ulbType());
            complaint.setUlbName(request.ulbName());
            complaint.setWardNumber(request.wardNumber());
            complaint.setAreaColony(request.areaColony());
            complaint.setAddress(request.address());

            complaint.setLatitude(request.latitude());
            complaint.setLongitude(request.longitude());
            complaint.setAccuracy(request.accuracy());
            complaint.setLocationSource(request.locationSource() != null ? request.locationSource() : "CURRENT_LOCATION");

            complaint.setDepartmentId(departmentName.replaceAll("\\s+", "_"));
            complaint.setDepartmentName(departmentName);

            complaint.setPriority(priority);
            complaint.setIsEmergency(isEmergency);
            complaint.setSlaHours(sla.slaHours());
            complaint.setSlaDeadline(sla.slaDeadline());
            complaint.setStatus(Constants.STATUS_SUBMITTED);

            complaint.setCitizenId(citizen.getId());
            complaint.setCitizenName(citizen.getName());
            complaint.setCitizenEmail(citizen.getEmail());
            complaint.setCitizenPhone(citizen.getPhone());

            try {
                savedComplaint = complaintRepository.saveAndFlush(complaint);
                break;
            } catch (DataIntegrityViolationException ex) {
                if (attempt == maxRetries - 1) {
                    throw new ApiException(HttpStatus.CONFLICT, "Unable to assign unique ticket code.");
                }
            }
        }

        if (savedComplaint == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create complaint record");
        }

        mediaService.saveMedia(savedComplaint.getId(), request.photo(), "PHOTO_BEFORE");
        mediaService.saveMedia(savedComplaint.getId(), request.beforePhotos(), "PHOTO_BEFORE");
        draftService.deleteDraft(citizen);

        ComplaintTimeline initialTimeline = new ComplaintTimeline(
                savedComplaint.getId(),
                Constants.STATUS_SUBMITTED,
                "Ticket Lodged",
                "Grievance submitted by citizen. Auto-routed to " + departmentName + ".",
                citizen.getName() != null ? citizen.getName() : "Citizen",
                citizen.getRole()
        );
        timelineRepository.save(initialTimeline);

        notificationService.createNotification(
                citizen.getId(),
                "Grievance Lodged: " + savedComplaint.getComplaintCode(),
                "Your grievance has been submitted and forwarded to " + departmentName + ".",
                "COMPLAINT",
                savedComplaint.getComplaintCode()
        );

        auditLogService.record(
                citizen,
                "CREATE_COMPLAINT",
                "COMPLAINT",
                savedComplaint.getComplaintCode(),
                "Lodged grievance under " + departmentName
        );

        TimelineResponse timelineDto = TimelineResponse.fromEntity(initialTimeline);
        return ComplaintResponse.fromEntity(savedComplaint, List.of(timelineDto));
    }

    private long resolveNextSequence(String prefix) {
        Optional<String> latestCode = complaintRepository.findTopComplaintCodeByPrefix(prefix);
        if (latestCode.isEmpty()) return 1L;
        try {
            String code = latestCode.get();
            int lastDash = code.lastIndexOf('-');
            if (lastDash >= 0 && lastDash < code.length() - 1) {
                return Long.parseLong(code.substring(lastDash + 1)) + 1L;
            }
        } catch (NumberFormatException e) {
            // fallback
        }
        return 1L;
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> getComplaints(User caller) {
        boolean isStaff = Constants.STAFF_ROLES.contains(caller.getRole().toUpperCase());
        List<Complaint> complaints = isStaff ?
                complaintRepository.findAllByOrderByCreatedAtDesc() :
                complaintRepository.findByCitizenIdOrderByCreatedAtDesc(caller.getId());

        return complaints.stream()
                .map(c -> ComplaintResponse.fromEntity(c, Collections.emptyList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> getMyComplaints(User caller) {
        return complaintRepository.findByCitizenIdOrderByCreatedAtDesc(caller.getId()).stream()
                .map(c -> ComplaintResponse.fromEntity(c, Collections.emptyList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintDetail(String idOrCode, User caller) {
        Complaint complaint = findByIdOrCode(idOrCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        boolean isStaff = Constants.STAFF_ROLES.contains(caller.getRole().toUpperCase());
        boolean isOwner = caller.getId().equals(complaint.getCitizenId());

        if (!isStaff && !isOwner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access forbidden: cannot view another user's complaint");
        }

        List<TimelineResponse> timeline = timelineRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId())
                .stream()
                .map(TimelineResponse::fromEntity)
                .toList();

        ComplaintMediaService.MediaBundle media = mediaService.extractMedia(complaint.getId());
        return ComplaintResponse.fromEntityWithMedia(complaint, timeline, media.photo(), media.beforePhotos(), media.afterPhotos());
    }

    @Transactional
    public ComplaintResponse updateStatus(String idOrCode, UpdateStatusRequest request, User staff) {
        if (!Constants.STAFF_ROLES.contains(staff.getRole().toUpperCase())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only authorized staff may update status");
        }

        if (!Constants.VALID_STATUSES.contains(request.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status: " + request.status());
        }

        Complaint complaint = findByIdOrCode(idOrCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (Constants.STATUS_CLOSED.equalsIgnoreCase(complaint.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Complaint is already closed and cannot be updated");
        }

        String newStatus = request.status();
        complaint.setStatus(newStatus);
        if (request.remarks() != null && !request.remarks().isBlank()) {
            complaint.setRemarks(request.remarks());
        }

        Instant now = Instant.now();
        if (Constants.STATUS_RESOLVED.equalsIgnoreCase(newStatus)) {
            complaint.setResolvedAt(now);
        } else if (Constants.STATUS_CLOSED.equalsIgnoreCase(newStatus)) {
            complaint.setClosedAt(now);
        }

        Complaint updatedComplaint = complaintRepository.save(complaint);
        if (request.afterPhotos() != null) {
            mediaService.saveMedia(updatedComplaint.getId(), request.afterPhotos(), "PHOTO_AFTER");
        }

        String remark = (request.remarks() != null && !request.remarks().isBlank()) ?
                request.remarks() : "Complaint status updated to " + newStatus;

        ComplaintTimeline timelineEvent = new ComplaintTimeline(
                updatedComplaint.getId(),
                newStatus,
                "Status: " + newStatus,
                remark,
                staff.getName() != null ? staff.getName() : "Officer",
                staff.getRole()
        );
        timelineRepository.save(timelineEvent);

        notificationService.createNotification(
                complaint.getCitizenId(),
                "Status Update: " + complaint.getComplaintCode(),
                "Your grievance status has been updated to: " + newStatus,
                "COMPLAINT",
                complaint.getComplaintCode()
        );

        auditLogService.record(
                staff,
                "UPDATE_STATUS",
                "COMPLAINT",
                complaint.getComplaintCode(),
                "Updated status to " + newStatus
        );

        List<TimelineResponse> timeline = timelineRepository.findByComplaintIdOrderByCreatedAtAsc(updatedComplaint.getId())
                .stream()
                .map(TimelineResponse::fromEntity)
                .toList();

        return ComplaintResponse.fromEntity(updatedComplaint, timeline);
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
