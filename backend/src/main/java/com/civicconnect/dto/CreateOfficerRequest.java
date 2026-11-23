package com.civicconnect.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Payload for admin creating a new department officer account.
 */
public record CreateOfficerRequest(
        @NotBlank(message = "Officer name is required")
        String name,

        @NotBlank(message = "Officer email is required")
        @Email(message = "Invalid email format")
        String email,

        @Pattern(regexp = "^$|^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
        String phone,

        @NotBlank(message = "Initial password is required")
        @JsonAlias({"password"})
        String initialPassword,

        @NotNull(message = "Department ID is required")
        Long departmentId
) {}
