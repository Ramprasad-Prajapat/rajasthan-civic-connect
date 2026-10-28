package com.civicconnect.dto;

/**
 * Payload for admin updating an existing department officer.
 */
public record UpdateOfficerRequest(
        String name,
        String phone,
        Long departmentId,
        Boolean active
) {}
