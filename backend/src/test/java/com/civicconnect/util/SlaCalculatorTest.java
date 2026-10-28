package com.civicconnect.util;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

class SlaCalculatorTest {

    @Test
    void testEmergencyPriorityHours() {
        SlaCalculator.SlaResult result = SlaCalculator.calculateSla("Normal", true);
        assertEquals(2, result.slaHours());
        assertTrue(result.slaDeadline().isAfter(Instant.now().plus(1, ChronoUnit.HOURS)));
    }

    @Test
    void testCriticalPriorityHours() {
        SlaCalculator.SlaResult result = SlaCalculator.calculateSla("Critical", false);
        assertEquals(6, result.slaHours());
    }

    @Test
    void testHighPriorityHours() {
        SlaCalculator.SlaResult result = SlaCalculator.calculateSla("High", false);
        assertEquals(12, result.slaHours());
    }

    @Test
    void testNormalPriorityHours() {
        SlaCalculator.SlaResult result = SlaCalculator.calculateSla("Normal", false);
        assertEquals(48, result.slaHours());

        SlaCalculator.SlaResult defaultResult = SlaCalculator.calculateSla(null, false);
        assertEquals(48, defaultResult.slaHours());
    }
}
