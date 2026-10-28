package com.civicconnect.controller;

import com.civicconnect.dto.ComplaintResponse;
import com.civicconnect.dto.CreateComplaintRequest;
import com.civicconnect.dto.UpdateStatusRequest;
import com.civicconnect.entity.User;
import com.civicconnect.service.ComplaintDraftService;
import com.civicconnect.service.ComplaintService;
import com.civicconnect.service.ComplaintWorkflowService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller handling complaint lifecycle endpoints: lodging, listing, draft forms, inspection, and status transitions.
 */
@RestController
@RequestMapping({"/api/complaints", "/complaints"})
public class ComplaintController {

    private final ComplaintService complaintService;
    private final ComplaintWorkflowService workflowService;
    private final ComplaintDraftService draftService;

    public ComplaintController(
            ComplaintService complaintService,
            ComplaintWorkflowService workflowService,
            ComplaintDraftService draftService
    ) {
        this.complaintService = complaintService;
        this.workflowService = workflowService;
        this.draftService = draftService;
    }

    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(
            @Valid @RequestBody CreateComplaintRequest request,
            @AuthenticationPrincipal User citizen
    ) {
        ComplaintResponse response = complaintService.createComplaint(request, citizen);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getComplaints(@AuthenticationPrincipal User caller) {
        return ResponseEntity.ok(complaintService.getComplaints(caller));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(@AuthenticationPrincipal User caller) {
        return ResponseEntity.ok(complaintService.getMyComplaints(caller));
    }

    @PostMapping("/draft")
    public ResponseEntity<Map<String, Object>> saveDraft(
            @RequestBody Object body,
            @AuthenticationPrincipal User caller
    ) {
        draftService.saveDraft(body, caller);
        return ResponseEntity.ok(Map.of("message", "Draft saved successfully", "draft", body));
    }

    @GetMapping("/draft")
    public ResponseEntity<Map<String, Object>> getDraft(@AuthenticationPrincipal User caller) {
        Object draft = draftService.getDraft(caller);
        Map<String, Object> resp = new HashMap<>();
        resp.put("draft", draft);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/draft")
    public ResponseEntity<Map<String, String>> deleteDraft(@AuthenticationPrincipal User caller) {
        draftService.deleteDraft(caller);
        return ResponseEntity.ok(Map.of("message", "Draft deleted successfully"));
    }

    @GetMapping("/{idOrCode}")
    public ResponseEntity<ComplaintResponse> getComplaintDetail(
            @PathVariable String idOrCode,
            @AuthenticationPrincipal User caller
    ) {
        return ResponseEntity.ok(complaintService.getComplaintDetail(idOrCode, caller));
    }

    @PutMapping("/{idOrCode}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable String idOrCode,
            @Valid @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal User staff
    ) {
        return ResponseEntity.ok(complaintService.updateStatus(idOrCode, request, staff));
    }

    @PutMapping("/{idOrCode}/assign-worker")
    public ResponseEntity<Map<String, Object>> assignWorker(
            @PathVariable String idOrCode,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User staff
    ) {
        return ResponseEntity.ok(workflowService.assignWorker(idOrCode, body, staff));
    }

    @PutMapping("/{idOrCode}/reopen")
    public ResponseEntity<Map<String, Object>> reopenComplaint(
            @PathVariable String idOrCode,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User caller
    ) {
        return ResponseEntity.ok(workflowService.reopenComplaint(idOrCode, body, caller));
    }

    @DeleteMapping("/{idOrCode}")
    public ResponseEntity<Map<String, String>> deleteComplaint(
            @PathVariable String idOrCode,
            @AuthenticationPrincipal User caller
    ) {
        return ResponseEntity.ok(workflowService.deleteComplaint(idOrCode, caller));
    }
}
