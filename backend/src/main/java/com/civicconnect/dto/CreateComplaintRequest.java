package com.civicconnect.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

/**
 * Payload for lodging a new civic grievance ticket.
 * Media fields are accepted and ignored per Section 6.4.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateComplaintRequest(
        String title,
        String description,

        @NotBlank(message = "Category is required")
        String category,

        String subCategory,
        String district,
        String ulbType,
        String ulbName,
        String wardNumber,
        String areaColony,
        String address,
        Double latitude,
        Double longitude,
        Double accuracy,
        String locationSource,
        String priority,
        Boolean isEmergency,
        Object photo,
        Object beforePhotos,
        String voiceNote,
        Object documents
) {}
