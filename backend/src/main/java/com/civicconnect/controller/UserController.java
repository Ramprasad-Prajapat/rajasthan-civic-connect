package com.civicconnect.controller;

import com.civicconnect.dto.UserDto;
import com.civicconnect.entity.User;
import com.civicconnect.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller providing user administration and profile inspection.
 */
@RestController
@RequestMapping({"/api/users", "/users"})
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(authService.getAllUsers(currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(authService.getUserById(id, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(authService.updateUser(id, body, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        authService.deleteUser(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
