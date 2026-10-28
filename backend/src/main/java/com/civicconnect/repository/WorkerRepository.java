package com.civicconnect.repository;

import com.civicconnect.entity.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for municipal workers.
 */
@Repository
public interface WorkerRepository extends JpaRepository<Worker, Long> {
    List<Worker> findByDepartmentId(String departmentId);
    List<Worker> findByStatus(String status);
}
