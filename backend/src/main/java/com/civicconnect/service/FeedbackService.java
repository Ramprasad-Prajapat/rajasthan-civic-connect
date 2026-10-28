package com.civicconnect.service;
import com.civicconnect.entity.Feedback;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.FeedbackRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

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
    public Feedback submitFeedback(Map<String, Object> payload, User caller) {
        if (caller == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required to submit feedback");
        }

        String complaintId = payload.get("complaintId") != null && !payload.get("complaintId").toString().isBlank() ?
                payload.get("complaintId").toString().trim() : "RJCIVIC-GENERAL";

        Integer rating = payload.get("rating") instanceof Number num ? num.intValue() : 5;
        String comment = payload.get("comment") != null ? payload.get("comment").toString() : "";

        Feedback feedback = new Feedback(complaintId, caller.getId(), caller.getName(), rating, comment);
        return feedbackRepository.save(feedback);
    }

    @Transactional(readOnly = true)
    public List<Feedback> getFeedbackForComplaint(String complaintId, User caller) {
        return feedbackRepository.findByComplaintIdOrderByCreatedAtDesc(complaintId);
    }
}
