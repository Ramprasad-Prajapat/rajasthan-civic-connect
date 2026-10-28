package com.civicconnect.dto;

import com.civicconnect.entity.Complaint;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Collections;
import java.util.List;

/**
 * Public response record for a complaint ticket.
 * Exposes id and complaintId as strings and attaches photo proofs and audit timelines.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ComplaintResponse(
        String id,
        String complaintId,
        String title,
        String description,
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
        String departmentId,
        String departmentName,
        Integer slaHours,
        String slaDeadline,
        String status,
        String citizenId,
        String citizenName,
        String citizenEmail,
        String citizenPhone,
        Boolean isEmergency,
        String remarks,
        String photo,
        List<String> beforePhotos,
        List<String> afterPhotos,
        List<TimelineResponse> timeline,
        String createdAt,
        String updatedAt,
        String resolvedAt,
        String closedAt
) {
    public static ComplaintResponse fromEntity(Complaint entity, List<TimelineResponse> timeline) {
        return fromEntityWithMedia(entity, timeline, "", Collections.emptyList(), Collections.emptyList());
    }

    public static ComplaintResponse fromEntityWithMedia(
            Complaint entity,
            List<TimelineResponse> timeline,
            String photo,
            List<String> beforePhotos,
            List<String> afterPhotos
    ) {
        String idStr = entity.getId() != null ? String.valueOf(entity.getId()) : entity.getComplaintCode();
        return new ComplaintResponse(
                idStr,
                entity.getComplaintCode(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getCategory(),
                entity.getSubCategory(),
                entity.getDistrict(),
                entity.getUlbType(),
                entity.getUlbName(),
                entity.getWardNumber(),
                entity.getAreaColony(),
                entity.getAddress(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.getAccuracy(),
                entity.getLocationSource(),
                entity.getPriority(),
                entity.getDepartmentId(),
                entity.getDepartmentName(),
                entity.getSlaHours(),
                entity.getSlaDeadline() != null ? entity.getSlaDeadline().toString() : null,
                entity.getStatus(),
                entity.getCitizenId() != null ? String.valueOf(entity.getCitizenId()) : null,
                entity.getCitizenName(),
                entity.getCitizenEmail(),
                entity.getCitizenPhone(),
                entity.getIsEmergency(),
                entity.getRemarks(),
                photo != null ? photo : "",
                beforePhotos != null ? beforePhotos : Collections.emptyList(),
                afterPhotos != null ? afterPhotos : Collections.emptyList(),
                timeline != null ? timeline : Collections.emptyList(),
                entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null,
                entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null,
                entity.getResolvedAt() != null ? entity.getResolvedAt().toString() : null,
                entity.getClosedAt() != null ? entity.getClosedAt().toString() : null
        );
    }
}
