package com.assetflow.controller;

import com.assetflow.dto.AssetRegistrationRequest;
import com.assetflow.dto.AssetResponse;
import com.assetflow.dto.AssetStatusUpdateRequest;
import com.assetflow.enums.AssetStatus;
import com.assetflow.service.AssetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    /**
     * Register a new asset.
     * Requires ASSET_MANAGER or ADMIN role.
     *
     * @param request the asset registration request
     * @return the created asset response with HTTP 201
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<AssetResponse> registerAsset(@Valid @RequestBody AssetRegistrationRequest request) {
        AssetResponse response = assetService.registerAsset(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Search for assets with optional filters.
     * Accessible to any authenticated user.
     *
     * @param categoryId optional category ID filter
     * @param status optional status filter
     * @param location optional location filter (partial match)
     * @param departmentId optional department ID filter
     * @param page optional page number (default 0)
     * @param size optional page size (default 20)
     * @return a page of assets matching the filters
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<AssetResponse>> searchAssets(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) AssetStatus status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AssetResponse> assets = assetService.searchAssets(categoryId, status, location, departmentId, page, size);
        return ResponseEntity.ok(assets);
    }

    /**
     * Get an asset by ID.
     * Accessible to any authenticated user.
     *
     * @param id the asset ID
     * @return the asset response
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssetResponse> getById(@PathVariable UUID id) {
        AssetResponse asset = assetService.getById(id);
        return ResponseEntity.ok(asset);
    }

    /**
     * Update the status of an asset.
     * Requires ASSET_MANAGER or ADMIN role.
     * Enforces valid status transitions.
     *
     * @param id the asset ID
     * @param request the status update request
     * @return the updated asset response
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<AssetResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody AssetStatusUpdateRequest request
    ) {
        AssetResponse response = assetService.updateStatus(id, request);
        return ResponseEntity.ok(response);
    }
}
