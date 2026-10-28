package com.civicconnect.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload for changing current user's password.
 */
public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New password is required")
        String newPassword
) {}
