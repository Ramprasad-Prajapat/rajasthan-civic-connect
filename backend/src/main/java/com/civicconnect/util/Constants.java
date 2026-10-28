package com.civicconnect.util;

import java.util.Set;

/**
 * System constants for roles, statuses, and priorities.
 * Preserves exact casing and strings used by the legacy Node system and frontend.
 */
public final class Constants {

    private Constants() {}

    // Roles
    public static final String ROLE_CITIZEN = "Citizen";
    public static final String ROLE_OFFICER = "Department Officer";
    public static final String ROLE_OFFICER_ALT = "Officer";
    public static final String ROLE_ADMIN = "Admin";
    public static final String ROLE_SUPER_ADMIN = "Super Admin";
    public static final String ROLE_WORKER = "Worker";

    public static final Set<String> STAFF_ROLES = Set.of(
            ROLE_ADMIN.toUpperCase(),
            "SUPER ADMIN",
            "SUPER_ADMIN",
            ROLE_OFFICER.toUpperCase(),
            ROLE_OFFICER_ALT.toUpperCase()
    );

    // Complaint Statuses
    public static final String STATUS_SUBMITTED = "Submitted";
    public static final String STATUS_ASSIGNED = "Assigned";
    public static final String STATUS_IN_PROGRESS = "InProgress";
    public static final String STATUS_RESOLVED = "Resolved";
    public static final String STATUS_CLOSED = "Closed";
    public static final String STATUS_REOPENED = "Reopened";
    public static final String STATUS_SLA_DELAYED = "SLA Delayed";

    public static final Set<String> VALID_STATUSES = Set.of(
            STATUS_SUBMITTED,
            STATUS_ASSIGNED,
            STATUS_IN_PROGRESS,
            "In Progress",
            STATUS_RESOLVED,
            STATUS_CLOSED,
            STATUS_REOPENED,
            STATUS_SLA_DELAYED,
            "SLA_Delayed"
    );

    // Priorities
    public static final String PRIORITY_NORMAL = "Normal";
    public static final String PRIORITY_HIGH = "High";
    public static final String PRIORITY_CRITICAL = "Critical";
    public static final String PRIORITY_EMERGENCY = "Emergency";
}
