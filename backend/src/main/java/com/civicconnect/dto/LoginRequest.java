package com.civicconnect.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

/**
 * Authentication login request payload.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record LoginRequest(
        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "Password is required")
        String password,

        String portal
) {}
