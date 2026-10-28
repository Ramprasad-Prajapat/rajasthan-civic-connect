package com.civicconnect.repository;

import com.civicconnect.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Data access repository for Complaint entities with aggregate analytical queries.
 */
@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Optional<Complaint> findByComplaintCode(String complaintCode);

    List<Complaint> findByCitizenIdOrderByCreatedAtDesc(Long citizenId);

    List<Complaint> findAllByOrderByCreatedAtDesc();

    @Query("SELECT c.complaintCode FROM Complaint c WHERE c.complaintCode LIKE CONCAT(:prefix, '-%') ORDER BY c.complaintCode DESC LIMIT 1")
    Optional<String> findTopComplaintCodeByPrefix(@Param("prefix") String prefix);

    long countByCitizenId(Long citizenId);

    long countByCitizenIdAndStatus(Long citizenId, String status);

    long countByStatus(String status);

    long countByIsEmergencyTrue();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.slaDeadline IS NOT NULL AND c.slaDeadline < CURRENT_TIMESTAMP AND c.status NOT IN ('Resolved', 'Closed')")
    long countSlaBreaches();

    @Query("SELECT c.district, COUNT(c) FROM Complaint c GROUP BY c.district")
    List<Object[]> countByDistrictGroup();

    @Query("SELECT c.departmentName, COUNT(c) FROM Complaint c GROUP BY c.departmentName")
    List<Object[]> countByDepartmentGroup();
}
