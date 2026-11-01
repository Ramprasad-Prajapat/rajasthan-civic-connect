package com.civicconnect.controller;

import com.civicconnect.dto.FeedbackRequest;
import com.civicconnect.entity.Feedback;
import com.civicconnect.entity.User;
import com.civicconnect.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller managing citizen resolution feedback.
 */
@RestController
@RequestMapping({"/api/feedback", "/feedback"})
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitFeedback(
            @Valid @RequestBody FeedbackRequest body,
            @AuthenticationPrincipal User caller
    ) {
        Feedback saved = feedbackService.submitFeedback(body, caller);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Feedback recorded successfully",
                "id", saved.getId()
        ));
    }

    @GetMapping("/{complaintId}")
    public ResponseEntity<List<Feedback>> getFeedback(
            @PathVariable String complaintId,
            @AuthenticationPrincipal User caller
    ) {
        return ResponseEntity.ok(feedbackService.getFeedbackForComplaint(complaintId, caller));
    }
}
