package com.assetflow.repository;

import com.assetflow.entity.Allocation;
import com.assetflow.enums.AllocationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AllocationRepository extends JpaRepository<Allocation, UUID> {

    /**
     * Find active allocation for an asset with pessimistic write lock.
     * This prevents concurrent allocation attempts on the same asset.
     *
     * @param assetId the asset ID
     * @param status the allocation status (typically ACTIVE)
     * @return Optional containing the active allocation if it exists
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Allocation a WHERE a.asset.id = :assetId AND a.status = :status")
    Optional<Allocation> findByAssetIdAndStatus(
            @Param("assetId") UUID assetId,
            @Param("status") AllocationStatus status
    );

    /**
     * Find all allocations for a holder with given status.
     *
     * @param holderId the holder ID
     * @param status the allocation status
     * @return list of allocations matching criteria
     */
    List<Allocation> findByHolderIdAndStatus(UUID holderId, AllocationStatus status);

    /**
     * Find all allocations (active and returned) for an asset, ordered by date descending.
     *
     * @param assetId the asset ID
     * @return list of allocations, most recent first
     */
    @Query("SELECT a FROM Allocation a WHERE a.asset.id = :assetId ORDER BY a.allocatedDate DESC")
    List<Allocation> findByAssetId(@Param("assetId") UUID assetId);

    /**
     * Find all active allocations (no lock).
     *
     * @return list of all active allocations
     */
    List<Allocation> findByStatus(AllocationStatus status);

    /**
     * Count allocations with given status.
     * Used for dashboard KPI metrics.
     *
     * @param status the allocation status
     * @return count of allocations with this status
     */
    long countByStatus(AllocationStatus status);
}
