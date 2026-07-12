package com.assetflow.service;

import com.assetflow.dto.AllocationRequest;
import com.assetflow.dto.AllocationResponse;
import com.assetflow.dto.AssetStatusUpdateRequest;
import com.assetflow.dto.ReturnRequest;
import com.assetflow.entity.Allocation;
import com.assetflow.entity.Asset;
import com.assetflow.entity.User;
import com.assetflow.enums.AllocationStatus;
import com.assetflow.enums.AssetStatus;
import com.assetflow.exception.AllocationNotFoundException;
import com.assetflow.exception.AssetAlreadyAllocatedException;
import com.assetflow.exception.InvalidAllocationStateException;
import com.assetflow.repository.AllocationRepository;
import com.assetflow.repository.AssetRepository;
import com.assetflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AllocationService {

    private final AllocationRepository allocationRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final AssetService assetService;

    /**
     * Allocate an asset to a holder.
     * Uses SERIALIZABLE isolation level with pessimistic lock to prevent concurrent allocation conflicts.
     *
     * @param request the allocation request
     * @param currentUser the user performing the allocation (must be ASSET_MANAGER, DEPARTMENT_HEAD, or ADMIN)
     * @return the created allocation as AllocationResponse
     * @throws AssetAlreadyAllocatedException if asset already has an active allocation
     * @throws AssetNotFoundException if asset not found
     * @throws UserNotFoundException if holder not found
     * @throws InvalidAllocationStateException if asset status is not AVAILABLE or RESERVED
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AllocationResponse allocate(AllocationRequest request, User currentUser) {
        // Load asset
        Asset asset = assetRepository.findById(request.assetId())
                .orElseThrow(() -> new com.assetflow.exception.AssetNotFoundException(
                        "Asset with ID " + request.assetId() + " not found"
                ));

        // Check for existing active allocation using pessimistic lock
        // This lock is held for the duration of the transaction
        java.util.Optional<Allocation> existingAllocation = allocationRepository.findByAssetIdAndStatus(
                request.assetId(),
                AllocationStatus.ACTIVE
        );

        if (existingAllocation.isPresent()) {
            Allocation active = existingAllocation.get();
            String holderName = active.getHolder().getName();
            String errorMessage = String.format(
                    "Asset %s is currently held by %s",
                    asset.getAssetTag(),
                    holderName
            );
            log.warn("Allocation conflict: {}", errorMessage);
            throw new AssetAlreadyAllocatedException(errorMessage, holderName);
        }

        // Verify asset status is AVAILABLE or RESERVED
        if (asset.getStatus() != AssetStatus.AVAILABLE && asset.getStatus() != AssetStatus.RESERVED) {
            throw new InvalidAllocationStateException(
                    String.format("Asset %s has status %s, cannot allocate. Status must be AVAILABLE or RESERVED.",
                            asset.getAssetTag(), asset.getStatus())
            );
        }

        // Load holder
        User holder = userRepository.findById(request.holderId())
                .orElseThrow(() -> new com.assetflow.exception.UserNotFoundException(
                        "User with ID " + request.holderId() + " not found"
                ));

        // Create allocation
        Allocation allocation = Allocation.builder()
                .asset(asset)
                .holder(holder)
                .allocatedDate(LocalDate.now())
                .expectedReturnDate(request.expectedReturnDate())
                .status(AllocationStatus.ACTIVE)
                .allocatedBy(currentUser)
                .build();

        Allocation saved = allocationRepository.save(allocation);

        // Update asset status to ALLOCATED via the existing asset service state machine
        try {
            assetService.updateStatus(asset.getId(), new AssetStatusUpdateRequest(AssetStatus.ALLOCATED));
        } catch (Exception e) {
            log.error("Failed to update asset status during allocation. Rolling back.", e);
            throw new RuntimeException("Failed to update asset status: " + e.getMessage());
        }

        log.info("Asset {} allocated to {} ({})", asset.getAssetTag(), holder.getName(), saved.getId());
        return mapToResponse(saved);
    }

    /**
     * Return an asset from allocation.
     *
     * @param allocationId the allocation ID
     * @param request the return request with optional condition notes
     * @param currentUser the user performing the return
     * @return the updated allocation as AllocationResponse
     * @throws AllocationNotFoundException if allocation not found
     * @throws InvalidAllocationStateException if allocation is already returned
     */
    @Transactional
    public AllocationResponse returnAsset(UUID allocationId, ReturnRequest request, User currentUser) {
        Allocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new AllocationNotFoundException(
                        "Allocation with ID " + allocationId + " not found"
                ));

        if (allocation.getStatus() != AllocationStatus.ACTIVE) {
            throw new InvalidAllocationStateException(
                    String.format("Allocation is already %s, cannot return an asset twice",
                            allocation.getStatus())
            );
        }

        allocation.setReturnedDate(LocalDate.now());
        allocation.setConditionAtReturn(request.conditionAtReturn());
        allocation.setStatus(AllocationStatus.RETURNED);

        Allocation updated = allocationRepository.save(allocation);

        // Update asset status back to AVAILABLE via the existing asset service state machine
        try {
            assetService.updateStatus(allocation.getAsset().getId(), 
                    new AssetStatusUpdateRequest(AssetStatus.AVAILABLE));
        } catch (Exception e) {
            log.error("Failed to update asset status during return. Rolling back.", e);
            throw new RuntimeException("Failed to update asset status: " + e.getMessage());
        }

        log.info("Asset {} returned from allocation {}", allocation.getAsset().getAssetTag(), allocationId);
        return mapToResponse(updated);
    }

    /**
     * Get allocation history for an asset (all allocations, active and returned).
     *
     * @param assetId the asset ID
     * @return list of allocations, most recent first
     */
    @Transactional(readOnly = true)
    public List<AllocationResponse> getAllocationHistory(UUID assetId) {
        List<Allocation> allocations = allocationRepository.findByAssetId(assetId);
        return allocations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all overdue allocations (active allocations past expected return date).
     *
     * @return list of overdue allocations
     */
    @Transactional(readOnly = true)
    public List<AllocationResponse> getOverdueAllocations() {
        LocalDate today = LocalDate.now();
        List<Allocation> allAllocations = allocationRepository.findByStatus(AllocationStatus.ACTIVE);

        return allAllocations.stream()
                .filter(a -> a.getExpectedReturnDate() != null && a.getExpectedReturnDate().isBefore(today))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get allocation by ID.
     *
     * @param id the allocation ID
     * @return the allocation as AllocationResponse
     * @throws AllocationNotFoundException if not found
     */
    @Transactional(readOnly = true)
    public AllocationResponse getById(UUID id) {
        Allocation allocation = allocationRepository.findById(id)
                .orElseThrow(() -> new AllocationNotFoundException(
                        "Allocation with ID " + id + " not found"
                ));
        return mapToResponse(allocation);
    }

    /**
     * Maps an Allocation entity to its DTO representation.
     *
     * @param allocation the allocation entity
     * @return the allocation as AllocationResponse
     */
    private AllocationResponse mapToResponse(Allocation allocation) {
        return new AllocationResponse(
                allocation.getId(),
                allocation.getAsset().getId(),
                allocation.getAsset().getAssetTag(),
                allocation.getHolder().getId(),
                allocation.getHolder().getName(),
                allocation.getAllocatedDate(),
                allocation.getExpectedReturnDate(),
                allocation.getReturnedDate(),
                allocation.getStatus(),
                allocation.getAllocatedBy().getName()
        );
    }
}
