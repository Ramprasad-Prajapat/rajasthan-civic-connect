package com.civicconnect.dto;

import jakarta.validation.constraints.Pattern;

/**
 * Payload for admin updating an existing department officer.
 */
public record UpdateOfficerRequest(
        String name,
        @Pattern(regexp = "^$|^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
        String phone,
        Long departmentId,
        Boolean active
) {}
