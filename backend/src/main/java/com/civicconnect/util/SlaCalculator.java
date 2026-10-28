package com.civicconnect.util;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Calculates SLA duration in hours and deadline timestamp based on grievance priority.
 * Directly ported from legacy Node slaCalculator.js.
 */
public final class SlaCalculator {

    private SlaCalculator() {}

    public record SlaResult(int slaHours, Instant slaDeadline) {}

    /**
     * Determines SLA hours: Emergency=2h, Critical=6h, High=12h, Normal=48h.
     */
    public static SlaResult calculateSla(String priority, boolean isEmergency) {
        int hours;
        if (isEmergency) {
            hours = 2;
        } else if ("Critical".equalsIgnoreCase(priority)) {
            hours = 6;
        } else if ("High".equalsIgnoreCase(priority)) {
            hours = 12;
        } else {
            hours = 48;
        }

        Instant deadline = Instant.now().plus(hours, ChronoUnit.HOURS);
        return new SlaResult(hours, deadline);
    }
}
