package com.civicconnect.repository;

import com.civicconnect.entity.ComplaintTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Data access repository for Complaint timeline history.
 */
@Repository
public interface ComplaintTimelineRepository extends JpaRepository<ComplaintTimeline, Long> {

    List<ComplaintTimeline> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);
}
