package com.civicconnect.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Registration request body. Role is ignored and forced to Citizen in service layer.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RegisterRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters long")
        String password,

        String mobile,
        String role,
        String portal
) {}
