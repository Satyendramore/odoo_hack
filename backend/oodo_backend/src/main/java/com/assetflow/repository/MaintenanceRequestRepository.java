package com.assetflow.repository;

import com.assetflow.entity.MaintenanceRequest;
import com.assetflow.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, UUID> {

    /**
     * Find all maintenance requests for an asset, ordered by creation date (most recent first).
     *
     * @param assetId the asset ID
     * @return list of maintenance requests ordered by createdAt descending
     */
    List<MaintenanceRequest> findByAssetIdOrderByCreatedAtDesc(UUID assetId);

    /**
     * Find all maintenance requests with given status.
     *
     * @param status the maintenance status
     * @return list of maintenance requests matching criteria
     */
    List<MaintenanceRequest> findByStatus(MaintenanceStatus status);

    /**
     * Count maintenance requests with given status.
     * Used for dashboard KPI metrics.
     *
     * @param status the maintenance status
     * @return count of requests with this status
     */
    long countByStatus(MaintenanceStatus status);
}
