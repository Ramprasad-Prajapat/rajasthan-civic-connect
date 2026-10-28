package com.civicconnect.dto;

import com.civicconnect.entity.User;
import com.fasterxml.jackson.annotation.JsonInclude;

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
        String status
) {
    public static UserDto fromEntity(User user) {
        String idStr = user.getId() != null ? String.valueOf(user.getId()) : null;
        return new UserDto(
                idStr,
                idStr,
                user.getName(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getPortal(),
                "Active"
        );
    }
}
