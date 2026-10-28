package com.civicconnect.dto;

/**
 * Department-scoped grievance metrics for officer dashboard.
 */
public record DepartmentStatsResponse(
        Long departmentId,
        String departmentName,
        long totalComplaints,
        long submittedComplaints,
        long inProgressComplaints,
        long resolvedComplaints,
        long overdueComplaints,
        long total,
        long submitted,
        long inProgress,
        long resolved,
        long overdue
) {
    public DepartmentStatsResponse(
            Long departmentId,
            String departmentName,
            long total,
            long submitted,
            long inProgress,
            long resolved,
            long overdue
    ) {
        this(
                departmentId,
                departmentName,
                total,
                submitted,
                inProgress,
                resolved,
                overdue,
                total,
                submitted,
                inProgress,
                resolved,
                overdue
        );
    }
}
