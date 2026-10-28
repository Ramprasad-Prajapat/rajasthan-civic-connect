package com.civicconnect.dto;

/**
 * Payload for admin updating an existing department.
 */
public record UpdateDepartmentRequest(
        String name,
        String code,
        String description,
        String contact,
        Boolean active
) {}
