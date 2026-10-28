package com.civicconnect.repository;

import com.civicconnect.entity.ComplaintMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for grievance photo attachments.
 */
@Repository
public interface ComplaintMediaRepository extends JpaRepository<ComplaintMedia, Long> {
    List<ComplaintMedia> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);
    void deleteByComplaintId(Long complaintId);
}
