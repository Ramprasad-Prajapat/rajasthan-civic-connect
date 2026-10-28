package com.civicconnect.controller;

import com.civicconnect.dto.AuthResponse;
import com.civicconnect.dto.ChangePasswordRequest;
import com.civicconnect.dto.LoginRequest;
import com.civicconnect.dto.RegisterRequest;
import com.civicconnect.dto.UserResponse;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller handling citizen registration, authentication, profile inspection, and password updates.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return ResponseEntity.ok(authService.getMe(currentUser));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User currentUser
    ) {
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return ResponseEntity.ok(authService.updateProfile(currentUser, body));
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        if (currentUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        authService.changePassword(currentUser, request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
