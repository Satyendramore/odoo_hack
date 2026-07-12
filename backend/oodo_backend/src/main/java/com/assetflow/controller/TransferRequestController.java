package com.assetflow.controller;

import com.assetflow.dto.TransferRequestCreateRequest;
import com.assetflow.dto.TransferRequestResponse;
import com.assetflow.entity.User;
import com.assetflow.enums.TransferRequestStatus;
import com.assetflow.service.TransferRequestService;
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
@RequestMapping("/transfer-requests")
@RequiredArgsConstructor
public class TransferRequestController {

    private final TransferRequestService transferRequestService;

    /**
     * Create a transfer request for an allocation.
     * Open to any authenticated user (current holder or their managers).
     *
     * @param allocationId the allocation ID to transfer
     * @param request the transfer request details
     * @param authentication the current user
     * @return the created transfer request with HTTP 201
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TransferRequestResponse> createTransferRequest(
            @RequestParam UUID allocationId,
            @Valid @RequestBody TransferRequestCreateRequest request,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        TransferRequestResponse response = transferRequestService.requestTransfer(allocationId, request, currentUser);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Approve a transfer request.
     * Requires ASSET_MANAGER, DEPARTMENT_HEAD, or ADMIN role.
     * Atomically creates new allocation and marks old as returned.
     *
     * @param id the transfer request ID
     * @param authentication the current user (approver)
     * @return the approved transfer request response
     */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD')")
    public ResponseEntity<TransferRequestResponse> approve(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        User approver = (User) authentication.getPrincipal();
        TransferRequestResponse response = transferRequestService.approve(id, approver);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject a transfer request.
     * Requires ASSET_MANAGER, DEPARTMENT_HEAD, or ADMIN role.
     *
     * @param id the transfer request ID
     * @param authentication the current user (approver)
     * @return the rejected transfer request response
     */
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD')")
    public ResponseEntity<TransferRequestResponse> reject(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        User approver = (User) authentication.getPrincipal();
        TransferRequestResponse response = transferRequestService.reject(id, approver);
        return ResponseEntity.ok(response);
    }

    /**
     * List all transfer requests, optionally filtered by status.
     * Open to ASSET_MANAGER and ADMIN for the approval queue view.
     *
     * @param status optional status filter (REQUESTED, APPROVED, REJECTED)
     * @return list of transfer requests
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<List<TransferRequestResponse>> list(
            @RequestParam(required = false) TransferRequestStatus status
    ) {
        List<TransferRequestResponse> requests = transferRequestService.listByStatus(status);
        return ResponseEntity.ok(requests);
    }

    /**
     * Get a specific transfer request by ID.
     * Open to ASSET_MANAGER and ADMIN.
     *
     * @param id the transfer request ID
     * @return the transfer request response
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<TransferRequestResponse> getById(@PathVariable UUID id) {
        TransferRequestResponse response = transferRequestService.getById(id);
        return ResponseEntity.ok(response);
    }
}
