package com.assetflow.dto;

public record DashboardSummaryResponse(
        long assetsAvailable,
        long assetsAllocated,
        long maintenanceInProgress,
        long maintenancePendingApproval,
        long activeBookings,
        long pendingTransferRequests,
        long upcomingReturns,
        long overdueReturns
) {
}
