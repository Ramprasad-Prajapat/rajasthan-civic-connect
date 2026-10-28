package com.civicconnect.service;

import com.civicconnect.dto.AuthResponse;
import com.civicconnect.dto.RegisterRequest;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.UserRepository;
import com.civicconnect.security.JwtService;
import com.civicconnect.util.Constants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void testRegisterDuplicateEmailThrows409Conflict() {
        RegisterRequest request = new RegisterRequest(
                "Test User",
                "existing@example.com",
                "secret123",
                "9876543210",
                "Citizen",
                "citizen"
        );

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> authService.register(request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("Email is already registered", ex.getMessage());
    }

    @Test
    void testRegisterForcesRoleToCitizenEvenIfAdminRequested() {
        RegisterRequest request = new RegisterRequest(
                "Sneaky User",
                "sneaky@example.com",
                "secret123",
                "9876543210",
                "Admin",
                "admin"
        );

        when(userRepository.existsByEmail("sneaky@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encodedPassword");

        User savedMockUser = new User("Sneaky User", "sneaky@example.com", "encodedPassword", "9876543210", Constants.ROLE_CITIZEN, "citizen");
        savedMockUser.setId(101L);
        when(userRepository.save(any(User.class))).thenReturn(savedMockUser);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("mock.jwt.token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals(Constants.ROLE_CITIZEN, response.user().role());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals(Constants.ROLE_CITIZEN, userCaptor.getValue().getRole());
    }
}
