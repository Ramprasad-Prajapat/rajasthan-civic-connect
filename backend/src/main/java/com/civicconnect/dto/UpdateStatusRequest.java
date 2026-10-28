package com.civicconnect.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

/**
 * Payload for updating grievance status by authorized staff.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record UpdateStatusRequest(
        @NotBlank(message = "Status is required")
        String status,

        String remarks,
        Object afterPhotos
) {}
