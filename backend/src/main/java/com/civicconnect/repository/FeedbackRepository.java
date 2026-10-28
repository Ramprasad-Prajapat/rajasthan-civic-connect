package com.civicconnect.repository;

import com.civicconnect.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for citizen feedback.
 */
@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByComplaintIdOrderByCreatedAtDesc(String complaintId);
    boolean existsByComplaintIdAndUserId(String complaintId, Long userId);
}
