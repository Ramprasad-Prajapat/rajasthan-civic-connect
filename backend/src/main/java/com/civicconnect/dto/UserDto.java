package com.civicconnect.dto;

import com.civicconnect.entity.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/**
 * Backward-compatible alias for UserResponse.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserDto(
        String id,
        String uid,
        String name,
        String fullName,
        String email,
        String phone,
        String role,
        String portal,
        String status,
        Long departmentId,
        String departmentName,
        Boolean active,
        Instant createdAt
) {
    public static UserDto fromEntity(User user) {
        return fromEntity(user, null);
    }

    public static UserDto fromEntity(User user, String departmentName) {
        String idStr = user.getId() != null ? String.valueOf(user.getId()) : null;
        boolean isActive = user.getActive() != null ? user.getActive() : true;
        return new UserDto(
                idStr,
                idStr,
                user.getName(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getPortal(),
                isActive ? "Active" : "Inactive",
                user.getDepartmentId(),
                departmentName,
                isActive,
                user.getCreatedAt()
        );
    }
}
