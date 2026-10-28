package com.civicconnect.repository;

import com.civicconnect.entity.Emergency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for emergency SOS reports.
 */
@Repository
public interface EmergencyRepository extends JpaRepository<Emergency, Long> {
    Optional<Emergency> findByEmergencyCode(String emergencyCode);
    List<Emergency> findAllByOrderByCreatedAtDesc();
    List<Emergency> findByUserIdOrderByCreatedAtDesc(Long userId);
}
