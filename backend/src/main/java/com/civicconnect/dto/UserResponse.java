package com.civicconnect.dto;

import com.civicconnect.entity.User;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Public user profile data transfer record. Exposes id and uid as strings.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserResponse(
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
    public static UserResponse fromEntity(User user) {
        String idStr = user.getId() != null ? String.valueOf(user.getId()) : null;
        return new UserResponse(
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
