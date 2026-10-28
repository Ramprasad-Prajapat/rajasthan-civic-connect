package com.civicconnect.dto;

import com.civicconnect.entity.ComplaintTimeline;

/**
 * Public response record for an entry in the complaint audit timeline.
 */
public record TimelineResponse(
        String id,
        String status,
        String title,
        String description,
        String updatedBy,
        String updatedByRole,
        String timestamp
) {
    public static TimelineResponse fromEntity(ComplaintTimeline entity) {
        String idStr = entity.getId() != null ? String.valueOf(entity.getId()) : null;
        String timeStr = entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null;
        return new TimelineResponse(
                idStr,
                entity.getStatus(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getUpdatedBy(),
                entity.getUpdatedByRole(),
                timeStr
        );
    }
}
