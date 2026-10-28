package com.civicconnect.service;

import com.civicconnect.dto.ComplaintResponse;
import com.civicconnect.dto.CreateComplaintRequest;
import com.civicconnect.dto.TimelineResponse;
import com.civicconnect.dto.UpdateStatusRequest;
import com.civicconnect.entity.Complaint;
import com.civicconnect.entity.ComplaintTimeline;
import com.civicconnect.entity.Department;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.ComplaintTimelineRepository;
import com.civicconnect.repository.DepartmentRepository;
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
 * Service orchestrating grievance lifecycle, department-scoped authorization, and status transitions.
 */
@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintTimelineRepository timelineRepository;
    private final DepartmentRepository departmentRepository;
    private final ComplaintMediaService mediaService;
    private final NotificationService notificationService;
    private final ComplaintDraftService draftService;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            ComplaintTimelineRepository timelineRepository,
            DepartmentRepository departmentRepository,
            ComplaintMediaService mediaService,
            NotificationService notificationService,
            ComplaintDraftService draftService
    ) {
        this.complaintRepository = complaintRepository;
        this.timelineRepository = timelineRepository;
        this.departmentRepository = departmentRepository;
        this.mediaService = mediaService;
        this.notificationService = notificationService;
        this.draftService = draftService;
    }

    @Transactional
    public ComplaintResponse createComplaint(CreateComplaintRequest request, User citizen) {
        String priority = request.priority() != null && !request.priority().isBlank()
                ? request.priority() : Constants.PRIORITY_NORMAL;

        String mappedDeptName = DepartmentMapper.mapCategoryToDepartment(request.category());
        Department department = resolveDepartment(mappedDeptName);

        SlaCalculator.SlaResult sla = SlaCalculator.calculateSla(priority, false);
        String prefix = ComplaintCodeGenerator.generatePrefix(request.district(), request.ulbName(), false);

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

            complaint.setDepartmentId(department.getId());
            complaint.setDepartmentName(department.getName());

            complaint.setPriority(priority);
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
                "Grievance submitted by citizen. Auto-routed to " + department.getName() + ".",
                citizen.getName() != null ? citizen.getName() : "Citizen",
                citizen.getRole()
        );
        timelineRepository.save(initialTimeline);

        notificationService.createNotification(
                citizen.getId(),
                "Grievance Lodged: " + savedComplaint.getComplaintCode(),
                "Your grievance has been submitted and forwarded to " + department.getName() + ".",
                "COMPLAINT",
                savedComplaint.getComplaintCode()
        );

        TimelineResponse timelineDto = TimelineResponse.fromEntity(initialTimeline);
        return ComplaintResponse.fromEntity(savedComplaint, List.of(timelineDto));
    }

    private Department resolveDepartment(String mappedDeptName) {
        return departmentRepository.findByNameIgnoreCase(mappedDeptName)
                .or(() -> departmentRepository.findByNameIgnoreCase("General Municipal Department"))
                .or(() -> departmentRepository.findAll().stream().findFirst())
                .orElseGet(() -> departmentRepository.save(new Department("General Municipal Department", "GEN", "General municipal affairs", "0141-2740000")));
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
    public List<ComplaintResponse> getComplaints(User caller, String status, Long departmentFilter) {
        if (Constants.ROLE_ADMIN.equalsIgnoreCase(caller.getRole())) {
            List<Complaint> list = (status != null && !status.isBlank())
                    ? complaintRepository.findByStatusOrderByCreatedAtDesc(status)
                    : complaintRepository.findAllByOrderByCreatedAtDesc();

            if (departmentFilter != null) {
                list = list.stream().filter(c -> departmentFilter.equals(c.getDepartmentId())).toList();
            }
            return list.stream().map(c -> ComplaintResponse.fromEntity(c, Collections.emptyList())).toList();
        }

        if (Constants.ROLE_OFFICER.equalsIgnoreCase(caller.getRole()) || Constants.ROLE_OFFICER_ALT.equalsIgnoreCase(caller.getRole())) {
            if (caller.getDepartmentId() == null) {
                return Collections.emptyList();
            }
            Long deptId = caller.getDepartmentId();
            List<Complaint> list = (status != null && !status.isBlank())
                    ? complaintRepository.findByDepartmentIdAndStatusOrderByCreatedAtDesc(deptId, status)
                    : complaintRepository.findByDepartmentIdOrderByCreatedAtDesc(deptId);
            return list.stream().map(c -> ComplaintResponse.fromEntity(c, Collections.emptyList())).toList();
        }

        // Citizen
        List<Complaint> list = complaintRepository.findByCitizenIdOrderByCreatedAtDesc(caller.getId());
        if (status != null && !status.isBlank()) {
            list = list.stream().filter(c -> status.equalsIgnoreCase(c.getStatus())).toList();
        }
        return list.stream().map(c -> ComplaintResponse.fromEntity(c, Collections.emptyList())).toList();
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

        if (Constants.ROLE_ADMIN.equalsIgnoreCase(caller.getRole())) {
            // Admin can view all
        } else if (Constants.ROLE_OFFICER.equalsIgnoreCase(caller.getRole()) || Constants.ROLE_OFFICER_ALT.equalsIgnoreCase(caller.getRole())) {
            if (caller.getDepartmentId() == null || !caller.getDepartmentId().equals(complaint.getDepartmentId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Access forbidden: cannot view complaint of another department");
            }
        } else {
            // Citizen
            if (!caller.getId().equals(complaint.getCitizenId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Access forbidden: cannot view another user's complaint");
            }
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
            throw new ApiException(HttpStatus.FORBIDDEN, "Only authorized officers or admins may update status");
        }

        if (!Constants.VALID_STATUSES.contains(request.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status: " + request.status());
        }

        Complaint complaint = findByIdOrCode(idOrCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        // Department Officer scoping check
        if (!Constants.ROLE_ADMIN.equalsIgnoreCase(staff.getRole())) {
            if (staff.getDepartmentId() == null || !staff.getDepartmentId().equals(complaint.getDepartmentId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Access denied: cannot update complaint of another department");
            }
        }

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

        List<TimelineResponse> timeline = timelineRepository.findByComplaintIdOrderByCreatedAtAsc(updatedComplaint.getId())
                .stream()
                .map(TimelineResponse::fromEntity)
                .toList();

        return ComplaintResponse.fromEntity(updatedComplaint, timeline);
    }

    @Transactional
    public ComplaintResponse reassignDepartment(String idOrCode, Long newDepartmentId, User admin) {
        if (!Constants.ROLE_ADMIN.equalsIgnoreCase(admin.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only administrators may reassign complaint department");
        }

        Complaint complaint = findByIdOrCode(idOrCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));

        Department targetDept = departmentRepository.findById(newDepartmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Target department not found"));

        String oldDeptName = complaint.getDepartmentName() != null ? complaint.getDepartmentName() : "Previous Department";
        complaint.setDepartmentId(targetDept.getId());
        complaint.setDepartmentName(targetDept.getName());

        Complaint saved = complaintRepository.save(complaint);

        String remark = "Department reassigned from " + oldDeptName + " to " + targetDept.getName() + " by Admin";
        ComplaintTimeline timelineEvent = new ComplaintTimeline(
                saved.getId(),
                saved.getStatus(),
                "Department Reassigned",
                remark,
                admin.getName() != null ? admin.getName() : "Administrator",
                admin.getRole()
        );
        timelineRepository.save(timelineEvent);

        notificationService.createNotification(
                saved.getCitizenId(),
                "Department Reassigned: " + saved.getComplaintCode(),
                "Your grievance has been reassigned to " + targetDept.getName() + ".",
                "COMPLAINT",
                saved.getComplaintCode()
        );

        List<TimelineResponse> timeline = timelineRepository.findByComplaintIdOrderByCreatedAtAsc(saved.getId())
                .stream()
                .map(TimelineResponse::fromEntity)
                .toList();

        return ComplaintResponse.fromEntity(saved, timeline);
    }

    public Optional<Complaint> findByIdOrCode(String idOrCode) {
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
