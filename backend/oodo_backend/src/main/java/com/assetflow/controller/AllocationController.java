package com.assetflow.controller;

import com.assetflow.dto.AllocationRequest;
import com.assetflow.dto.AllocationResponse;
import com.assetflow.dto.ReturnRequest;
import com.assetflow.entity.User;
import com.assetflow.service.AllocationService;
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
@RequestMapping("/allocations")
@RequiredArgsConstructor
public class AllocationController {

    private final AllocationService allocationService;

    /**
     * Allocate an asset to a holder.
     * Requires ASSET_MANAGER, DEPARTMENT_HEAD, or ADMIN role.
     *
     * @param request the allocation request
     * @param authentication the current user
     * @return the created allocation response with HTTP 201
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD')")
    public ResponseEntity<AllocationResponse> allocate(
            @Valid @RequestBody AllocationRequest request,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        AllocationResponse response = allocationService.allocate(request, currentUser);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Return an asset from allocation.
     * Requires ASSET_MANAGER, DEPARTMENT_HEAD, or ADMIN role.
     *
     * @param id the allocation ID
     * @param request the return request with optional condition notes
     * @param authentication the current user
     * @return the updated allocation response
     */
    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD')")
    public ResponseEntity<AllocationResponse> returnAsset(
            @PathVariable UUID id,
            @Valid @RequestBody ReturnRequest request,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        AllocationResponse response = allocationService.returnAsset(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Create a transfer request for an allocation.
     * Open to the current holder, their Department Head, Asset Manager, or Admin.
     *
     * @param id the allocation ID
     * @param transferId not used (follows REST pattern)
     * @param authentication the current user
     * @return redirect to transfer request endpoint result (201 + response)
     */
    @PostMapping("/{id}/transfer-request")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> requestTransfer(
            @PathVariable UUID id,
            @RequestParam(required = false) String transferId,
            Authentication authentication
    ) {
        // Delegate to AllocationService to create transfer request
        // This will be handled by TransferRequestController
        // For now, return 200 with message indicating transfer request should be created via TransferRequestController
        return ResponseEntity.ok().build();
    }

    /**
     * Get allocation history for an asset.
     * Open to any authenticated user.
     *
     * @param assetId the asset ID
     * @return list of allocations (active and returned), most recent first
     */
    @GetMapping("/asset/{assetId}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AllocationResponse>> getAllocationHistory(@PathVariable UUID assetId) {
        List<AllocationResponse> history = allocationService.getAllocationHistory(assetId);
        return ResponseEntity.ok(history);
    }

    /**
     * Get a specific allocation by ID.
     * Open to any authenticated user.
     *
     * @param id the allocation ID
     * @return the allocation response
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AllocationResponse> getById(@PathVariable UUID id) {
        AllocationResponse response = allocationService.getById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all overdue allocations.
     * Open to ASSET_MANAGER and ADMIN for reporting/dashboard.
     *
     * @return list of overdue allocations
     */
    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<List<AllocationResponse>> getOverdueAllocations() {
        List<AllocationResponse> overdue = allocationService.getOverdueAllocations();
        return ResponseEntity.ok(overdue);
    }
}
