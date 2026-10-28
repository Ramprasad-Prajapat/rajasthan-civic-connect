package com.civicconnect.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Authentication response enclosing message, JWT token, user profile, and email alias.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
        String message,
        String token,
        UserDto user,
        String email
) {}
