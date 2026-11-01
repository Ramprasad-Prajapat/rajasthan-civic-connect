package com.civicconnect.service;

import com.civicconnect.dto.FeedbackRequest;
import com.civicconnect.entity.Feedback;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.FeedbackRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing citizen satisfaction feedback ratings.
 */
@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final ComplaintRepository complaintRepository;

    public FeedbackService(FeedbackRepository feedbackRepository, ComplaintRepository complaintRepository) {
        this.feedbackRepository = feedbackRepository;
        this.complaintRepository = complaintRepository;
    }

    @Transactional
    public Feedback submitFeedback(FeedbackRequest request, User caller) {
        if (caller == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required to submit feedback");
        }

        String complaintId = request.complaintId() != null && !request.complaintId().isBlank() ?
                request.complaintId().trim() : "RJCIVIC-GENERAL";

        Integer rating = request.rating() != null ? request.rating() : 5;
        String comment = request.comment() != null ? request.comment() : "";

        Feedback feedback = new Feedback(complaintId, caller.getId(), caller.getName(), rating, comment);
        return feedbackRepository.save(feedback);
    }

    @Transactional(readOnly = true)
    public List<Feedback> getFeedbackForComplaint(String complaintId, User caller) {
        return feedbackRepository.findByComplaintIdOrderByCreatedAtDesc(complaintId);
    }
}
