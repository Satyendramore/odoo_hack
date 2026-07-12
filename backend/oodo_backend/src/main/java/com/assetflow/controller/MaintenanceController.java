package com.assetflow.controller;

import com.assetflow.dto.MaintenanceApprovalRequest;
import com.assetflow.dto.MaintenanceRequestCreate;
import com.assetflow.dto.MaintenanceResponse;
import com.assetflow.dto.MaintenanceResolveRequest;
import com.assetflow.entity.User;
import com.assetflow.service.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    /**
     * Raise a new maintenance request for an asset.
     * Open to any authenticated user.
     *
     * @param request the maintenance request
     * @param authentication the current user
     * @return the created maintenance request with HTTP 201
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MaintenanceResponse> raise(
            @Valid @RequestBody MaintenanceRequestCreate request,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        MaintenanceResponse response = maintenanceService.raise(request, currentUser);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Approve a maintenance request.
     * Requires ASSET_MANAGER or ADMIN role.
     *
     * @param id the maintenance request ID
     * @param approval the approval details
     * @param authentication the current user
     * @return the approved maintenance request
     */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ASSET_MANAGER', 'ADMIN')")
    public ResponseEntity<MaintenanceResponse> approve(
            @PathVariable UUID id,
            @Valid @RequestBody MaintenanceApprovalRequest approval,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        MaintenanceResponse response = maintenanceService.approve(id, approval, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject a maintenance request.
     * Requires ASSET_MANAGER or ADMIN role.
     *
     * @param id the maintenance request ID
     * @param authentication the current user
     * @return the rejected maintenance request
     */
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ASSET_MANAGER', 'ADMIN')")
    public ResponseEntity<MaintenanceResponse> reject(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        MaintenanceResponse response = maintenanceService.reject(id, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Resolve a maintenance request.
     * Requires ASSET_MANAGER or ADMIN role.
     *
     * @param id the maintenance request ID
     * @param resolveRequest the resolution details
     * @param authentication the current user
     * @return the resolved maintenance request
     */
    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ASSET_MANAGER', 'ADMIN')")
    public ResponseEntity<MaintenanceResponse> resolve(
            @PathVariable UUID id,
            @Valid @RequestBody MaintenanceResolveRequest resolveRequest,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        MaintenanceResponse response = maintenanceService.resolve(id, resolveRequest, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Get maintenance history for an asset.
     * Open to any authenticated user.
     *
     * @param assetId the asset ID
     * @return list of maintenance requests for the asset
     */
    @GetMapping("/asset/{assetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MaintenanceResponse>> getHistory(@PathVariable UUID assetId) {
        List<MaintenanceResponse> history = maintenanceService.getHistory(assetId);
        return ResponseEntity.ok(history);
    }

    /**
     * Get all maintenance requests (paginated or all).
     * Open to any authenticated user.
     *
     * @return list of all maintenance requests
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MaintenanceResponse>> getAll() {
        List<MaintenanceResponse> requests = maintenanceService.getAll();
        return ResponseEntity.ok(requests);
    }
}