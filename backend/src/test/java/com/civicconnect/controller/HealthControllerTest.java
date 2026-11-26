package com.civicconnect.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class HealthControllerTest {

    @Test
    void defaultsToDevelopmentWhenNoProfileOrConfiguredEnvironment() {
        MockEnvironment env = new MockEnvironment();
        HealthController controller = new HealthController(env);

        ResponseEntity<Map<String, Object>> response = controller.health();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("healthy", response.getBody().get("status"));
        assertEquals("development", response.getBody().get("environment"));
    }

    @Test
    void usesActiveSpringProfileWhenSet() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("production");
        HealthController controller = new HealthController(env);

        ResponseEntity<Map<String, Object>> response = controller.health();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("production", response.getBody().get("environment"));
    }

    @Test
    void prefersExplicitAppEnvironmentOverActiveProfile() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("production");
        HealthController controller = new HealthController(env);
        ReflectionTestUtils.setField(controller, "configuredEnvironment", "staging");

        ResponseEntity<Map<String, Object>> response = controller.health();
        assertEquals("staging", response.getBody().get("environment"));
    }
}
