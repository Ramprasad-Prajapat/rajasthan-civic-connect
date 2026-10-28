package com.civicconnect.controller;

import com.civicconnect.dto.AuthResponse;
import com.civicconnect.dto.LoginRequest;
import com.civicconnect.dto.RegisterRequest;
import com.civicconnect.dto.UserDto;
import com.civicconnect.entity.User;
import com.civicconnect.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Controller handling user registration, authentication, current profile, and unsupported legacy auth endpoints.
 */
@RestController
@RequestMapping({"/api/auth", "/auth"})
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
    public ResponseEntity<UserDto> getMe(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(authService.getMe(currentUser));
    }

    @PostMapping({"/sync-user", "/forgot-password-verify", "/reset-password"})
    public ResponseEntity<Map<String, Object>> authUnsupported() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("error", "This sign-in method is not available in this version");
        body.put("message", "This sign-in method is not available in this version");
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(body);
    }
}
