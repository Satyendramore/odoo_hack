package com.assetflow.service;

import com.assetflow.dto.AssetRegistrationRequest;
import com.assetflow.dto.AssetResponse;
import com.assetflow.dto.AssetStatusUpdateRequest;
import com.assetflow.entity.Asset;
import com.assetflow.entity.AssetCategory;
import com.assetflow.entity.Department;
import com.assetflow.enums.AssetStatus;
import com.assetflow.exception.AssetNotFoundException;
import com.assetflow.exception.CategoryNotFoundException;
import com.assetflow.exception.DepartmentNotFoundException;
import com.assetflow.exception.InvalidStatusTransitionException;
import com.assetflow.repository.AssetRepository;
import com.assetflow.repository.AssetCategoryRepository;
import com.assetflow.repository.DepartmentRepository;
import com.assetflow.specification.AssetSpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssetService {

    private final AssetRepository assetRepository;
    private final AssetCategoryRepository assetCategoryRepository;
    private final DepartmentRepository departmentRepository;
    private final AssetTagGenerator assetTagGenerator;

    // Define allowed status transitions
    private static final Map<AssetStatus, Set<AssetStatus>> ALLOWED_TRANSITIONS = Map.ofEntries(
            Map.entry(AssetStatus.AVAILABLE, Set.of(AssetStatus.ALLOCATED, AssetStatus.RESERVED, AssetStatus.UNDER_MAINTENANCE, AssetStatus.LOST, AssetStatus.RETIRED)),
            Map.entry(AssetStatus.ALLOCATED, Set.of(AssetStatus.AVAILABLE, AssetStatus.LOST)),
            Map.entry(AssetStatus.RESERVED, Set.of(AssetStatus.AVAILABLE, AssetStatus.ALLOCATED)),
            Map.entry(AssetStatus.UNDER_MAINTENANCE, Set.of(AssetStatus.AVAILABLE, AssetStatus.RETIRED)),
            Map.entry(AssetStatus.LOST, Set.of(AssetStatus.AVAILABLE, AssetStatus.RETIRED)),
            Map.entry(AssetStatus.RETIRED, Set.of(AssetStatus.DISPOSED)),
            Map.entry(AssetStatus.DISPOSED, Collections.emptySet())
    );

    /**
     * Registers a new asset with the provided details.
     * Generates a unique asset tag, validates dependencies, and persists the asset.
     *
     * @param request the asset registration request
     * @return the created asset as an AssetResponse
     * @throws CategoryNotFoundException if category is not found
     * @throws DepartmentNotFoundException if department (if provided) is not found
     */
    @Transactional
    public AssetResponse registerAsset(AssetRegistrationRequest request) {
        // Validate and resolve category
        AssetCategory category = assetCategoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new CategoryNotFoundException("Asset category with ID " + request.categoryId() + " not found"));

        // Validate and resolve department if provided
        Department department = null;
        if (request.departmentId() != null) {
            department = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new DepartmentNotFoundException("Department with ID " + request.departmentId() + " not found"));
        }

        // Generate unique asset tag
        String assetTag = assetTagGenerator.generateAssetTag();

        // Create and persist the asset
        Asset asset = Asset.builder()
                .assetTag(assetTag)
                .name(request.name())
                .category(category)
                .serialNumber(request.serialNumber())
                .acquisitionDate(request.acquisitionDate())
                .acquisitionCost(request.acquisitionCost())
                .condition(request.condition())
                .location(request.location())
                .department(department)
                .status(AssetStatus.AVAILABLE)
                .isBookable(request.isBookable())
                .photoUrl(request.photoUrl())
                .build();

        Asset saved = assetRepository.save(asset);
        log.info("Asset registered successfully: {} ({})", assetTag, saved.getId());
        return mapToResponse(saved);
    }

    /**
     * Searches for assets based on optional filter criteria.
     * Uses Spring Data JPA Specifications for flexible filtering.
     *
     * @param categoryId optional category ID filter
     * @param status optional status filter
     * @param location optional location filter (partial match)
     * @param departmentId optional department ID filter
     * @param page optional page number (default 0)
     * @param size optional page size (default 20)
     * @return a page of assets matching the filters
     */
    @Transactional(readOnly = true)
    public Page<AssetResponse> searchAssets(UUID categoryId, AssetStatus status, String location, UUID departmentId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        Specification<Asset> spec = Specification.where(AssetSpecifications.hasCategory(categoryId))
                .and(AssetSpecifications.hasStatus(status))
                .and(AssetSpecifications.hasLocation(location))
                .and(AssetSpecifications.hasDepartment(departmentId));

        Page<Asset> assets = assetRepository.findAll(spec, pageable);
        return assets.map(this::mapToResponse);
    }

    /**
     * Retrieves an asset by its ID.
     *
     * @param id the asset ID
     * @return the asset as an AssetResponse
     * @throws AssetNotFoundException if asset is not found
     */
    @Transactional(readOnly = true)
    public AssetResponse getById(UUID id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new AssetNotFoundException("Asset with ID " + id + " not found"));
        return mapToResponse(asset);
    }

    /**
     * Updates the status of an asset, enforcing valid status transitions.
     * Uses a predefined set of allowed transitions to validate the state change.
     *
     * @param id the asset ID
     * @param request the status update request
     * @return the updated asset as an AssetResponse
     * @throws AssetNotFoundException if asset is not found
     * @throws InvalidStatusTransitionException if the transition is not allowed
     */
    @Transactional
    public AssetResponse updateStatus(UUID id, AssetStatusUpdateRequest request) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new AssetNotFoundException("Asset with ID " + id + " not found"));

        AssetStatus currentStatus = asset.getStatus();
        AssetStatus newStatus = request.status();

        // Validate transition
        if (!isValidTransition(currentStatus, newStatus)) {
            throw new InvalidStatusTransitionException(
                    String.format("Cannot transition asset from %s to %s", currentStatus, newStatus)
            );
        }

        asset.setStatus(newStatus);
        Asset updated = assetRepository.save(asset);
        log.info("Asset {} status updated from {} to {}", id, currentStatus, newStatus);
        return mapToResponse(updated);
    }

    /**
     * Checks if a transition from one status to another is allowed.
     *
     * @param from the current status
     * @param to the desired status
     * @return true if transition is allowed, false otherwise
     */
    private boolean isValidTransition(AssetStatus from, AssetStatus to) {
        Set<AssetStatus> allowedStates = ALLOWED_TRANSITIONS.get(from);
        if (allowedStates == null) {
            return false;
        }
        return allowedStates.contains(to);
    }

    /**
     * Maps an Asset entity to its DTO representation.
     *
     * @param asset the asset entity
     * @return the asset as an AssetResponse
     */
    private AssetResponse mapToResponse(Asset asset) {
        return new AssetResponse(
                asset.getId(),
                asset.getAssetTag(),
                asset.getName(),
                asset.getCategory().getName(),
                asset.getCategory().getId(),
                asset.getSerialNumber(),
                asset.getAcquisitionDate(),
                asset.getAcquisitionCost(),
                asset.getCondition(),
                asset.getLocation(),
                asset.getDepartment() != null ? asset.getDepartment().getName() : null,
                asset.getDepartment() != null ? asset.getDepartment().getId() : null,
                asset.getStatus(),
                asset.getIsBookable(),
                asset.getPhotoUrl(),
                asset.getCreatedAt()
        );
    }
}
