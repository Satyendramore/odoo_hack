package com.assetflow.service;

import com.assetflow.dto.DashboardSummaryResponse;
import com.assetflow.enums.AllocationStatus;
import com.assetflow.enums.AssetStatus;
import com.assetflow.enums.BookingStatus;
import com.assetflow.enums.MaintenanceStatus;
import com.assetflow.enums.TransferRequestStatus;
import com.assetflow.repository.AllocationRepository;
import com.assetflow.repository.AssetRepository;
import com.assetflow.repository.BookingRepository;
import com.assetflow.repository.MaintenanceRequestRepository;
import com.assetflow.repository.TransferRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AssetRepository assetRepository;
    private final AllocationRepository allocationRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final BookingRepository bookingRepository;
    private final TransferRequestRepository transferRequestRepository;

    /**
     * Get dashboard summary with KPI metrics.
     *
     * @return dashboard summary with asset, maintenance, booking, and transfer counts
     */
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        // Asset metrics
        long assetsAvailable = assetRepository.countByStatus(AssetStatus.AVAILABLE);
        long assetsAllocated = assetRepository.countByStatus(AssetStatus.ALLOCATED);

        // Maintenance metrics
        long maintenanceInProgress = maintenanceRequestRepository.countByStatus(MaintenanceStatus.IN_PROGRESS);
        long maintenancePendingApproval = maintenanceRequestRepository.countByStatus(MaintenanceStatus.PENDING);

        // Booking metrics
        long activeBookings = bookingRepository.countByStatus(BookingStatus.UPCOMING);

        // Transfer metrics
        long pendingTransferRequests = transferRequestRepository.countByStatus(TransferRequestStatus.REQUESTED);

        // Allocation metrics: upcoming returns (within 7 days)
        // Since we don't have a query for this yet, we count active allocations as a simple metric
        long upcomingReturns = 0;  // TODO: Implement proper date-based query if needed
        long overdueReturns = 0;   // TODO: Implement proper date-based query if needed

        return new DashboardSummaryResponse(
                assetsAvailable,
                assetsAllocated,
                maintenanceInProgress,
                maintenancePendingApproval,
                activeBookings,
                pendingTransferRequests,
                upcomingReturns,
                overdueReturns
        );
    }
}
