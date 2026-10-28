package com.civicconnect.repository;

import com.civicconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Data access repository for User entities.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(String role);

    List<User> findByRoleIn(Collection<String> roles);

    List<User> findByDepartmentId(Long departmentId);

    List<User> findAllByOrderByCreatedAtDesc();

    long countByRole(String role);

    long countByRoleIn(Collection<String> roles);

    long countByDepartmentId(Long departmentId);

    long countByDepartmentIdAndRole(Long departmentId, String role);
}
