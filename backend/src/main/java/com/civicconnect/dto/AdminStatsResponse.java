package com.civicconnect.dto;

/**
 * High-level municipal metrics for administrator dashboard.
 */
public record AdminStatsResponse(
        long totalComplaints,
        long submittedComplaints,
        long inProgressComplaints,
        long resolvedComplaints,
        long closedComplaints,
        long overdueComplaints,
        long totalDepartments,
        long totalOfficers,
        long totalCitizens
) {}
