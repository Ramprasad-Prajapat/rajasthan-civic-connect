package com.civicconnect.repository;

import com.civicconnect.entity.ComplaintDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for grievance draft forms.
 */
@Repository
public interface ComplaintDraftRepository extends JpaRepository<ComplaintDraft, Long> {
    Optional<ComplaintDraft> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
