package com.civicconnect.dto;

import com.civicconnect.entity.Department;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Public response record for municipal departments.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DepartmentResponse(
        Long id,
        String name,
        String code,
        String description,
        String contact,
        Boolean active,
        Instant createdAt,
        Instant updatedAt,
        Long officerCount,
        Long complaintCount
) {
    public static DepartmentResponse fromEntity(Department entity) {
        return fromEntity(entity, null, null);
    }

    public static DepartmentResponse fromEntity(Department entity, Long officerCount, Long complaintCount) {
        return new DepartmentResponse(
                entity.getId(),
                entity.getName(),
                entity.getCode(),
                entity.getDescription(),
                entity.getContact(),
                entity.getActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                officerCount,
                complaintCount
        );
    }
}
