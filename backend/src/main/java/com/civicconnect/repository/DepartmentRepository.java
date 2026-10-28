package com.civicconnect.repository;

import com.civicconnect.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for departments.
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByName(String name);
    Optional<Department> findByNameIgnoreCase(String name);
    boolean existsByName(String name);
    boolean existsByNameIgnoreCase(String name);
    List<Department> findByActiveTrue();
    List<Department> findAllByOrderByNameAsc();
}
