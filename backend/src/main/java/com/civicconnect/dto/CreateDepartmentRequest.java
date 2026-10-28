package com.civicconnect.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload for admin creating a new municipal department.
 */
public record CreateDepartmentRequest(
        @NotBlank(message = "Department name is required")
        String name,

        String code,
        String description,
        String contact
) {}
