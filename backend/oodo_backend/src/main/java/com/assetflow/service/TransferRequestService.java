package com.assetflow.service;

import com.assetflow.dto.AssetStatusUpdateRequest;
import com.assetflow.dto.TransferRequestCreateRequest;
import com.assetflow.dto.TransferRequestResponse;
import com.assetflow.entity.Allocation;
import com.assetflow.entity.TransferRequest;
import com.assetflow.entity.User;
import com.assetflow.enums.AllocationStatus;
import com.assetflow.enums.AssetStatus;
import com.assetflow.enums.TransferRequestStatus;
import com.assetflow.exception.AllocationNotFoundException;
import com.assetflow.exception.InvalidAllocationStateException;
import com.assetflow.exception.TransferRequestNotFoundException;
import com.assetflow.repository.AllocationRepository;
import com.assetflow.repository.TransferRequestRepository;
import com.assetflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransferRequestService {

    private final TransferRequestRepository transferRequestRepository;
    private final AllocationRepository allocationRepository;
    private final UserRepository userRepository;
    private final AssetService assetService;

    /**
     * Create a transfer request for an active allocation.
     *
     * @param allocationId the allocation ID to transfer
     * @param request the transfer request details
     * @param currentUser the user requesting the transfer (current holder)
     * @return the created transfer request as TransferRequestResponse
     * @throws AllocationNotFoundException if allocation not found
     * @throws InvalidAllocationStateException if allocation is not ACTIVE
     * @throws UserNotFoundException if requestedTo user not found
     */
    @Transactional
    public TransferRequestResponse requestTransfer(
            UUID allocationId,
            TransferRequestCreateRequest request,
            User currentUser
    ) {
        // Load and verify allocation
        Allocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new AllocationNotFoundException(
                        "Allocation with ID " + allocationId + " not found"
                ));

        if (allocation.getStatus() != AllocationStatus.ACTIVE) {
            throw new InvalidAllocationStateException(
                    String.format("Cannot request transfer for allocation with status %s. Only ACTIVE allocations can be transferred.",
                            allocation.getStatus())
            );
        }

        // Load requestedTo user
        User requestedTo = userRepository.findById(request.requestedToId())
                .orElseThrow(() -> new com.assetflow.exception.UserNotFoundException(
                        "User with ID " + request.requestedToId() + " not found"
                ));

        // Create transfer request
        TransferRequest transferRequest = TransferRequest.builder()
                .allocation(allocation)
                .requestedBy(currentUser)
                .requestedTo(requestedTo)
                .status(TransferRequestStatus.REQUESTED)
                .build();

        TransferRequest saved = transferRequestRepository.save(transferRequest);
        log.info("Transfer request created: {} for allocation {} to user {}",
                saved.getId(), allocationId, requestedTo.getName());
        return mapToResponse(saved);
    }

    /**
     * Approve a transfer request.
     * Atomically:
     * 1. Mark the transfer request as APPROVED
     * 2. Mark the old allocation as RETURNED
     * 3. Create a new allocation for the requestedTo user as the new holder
     * 4. Keep asset status as ALLOCATED throughout (no flickering)
     *
     * @param transferRequestId the transfer request ID
     * @param approver the user approving the transfer (must be ASSET_MANAGER, DEPARTMENT_HEAD, or ADMIN)
     * @return the approved transfer request as TransferRequestResponse
     * @throws TransferRequestNotFoundException if transfer request not found
     * @throws InvalidAllocationStateException if transfer request status is not REQUESTED
     */
    @Transactional
    public TransferRequestResponse approve(UUID transferRequestId, User approver) {
        // Load transfer request
        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new TransferRequestNotFoundException(
                        "Transfer request with ID " + transferRequestId + " not found"
                ));

        if (transferRequest.getStatus() != TransferRequestStatus.REQUESTED) {
            throw new InvalidAllocationStateException(
                    String.format("Transfer request status is %s, cannot approve. Only REQUESTED requests can be approved.",
                            transferRequest.getStatus())
            );
        }

        // Mark transfer request as approved
        transferRequest.setStatus(TransferRequestStatus.APPROVED);
        transferRequest.setApprovedBy(approver);
        transferRequest.setResolvedAt(Instant.now());

        // Mark old allocation as RETURNED (no condition check-in for transfers)
        Allocation oldAllocation = transferRequest.getAllocation();
        oldAllocation.setStatus(AllocationStatus.RETURNED);
        oldAllocation.setReturnedDate(LocalDate.now());
        allocationRepository.save(oldAllocation);

        // Create new allocation for requestedTo user
        Allocation newAllocation = Allocation.builder()
                .asset(oldAllocation.getAsset())
                .holder(transferRequest.getRequestedTo())
                .department(oldAllocation.getDepartment())
                .allocatedDate(LocalDate.now())
                .expectedReturnDate(oldAllocation.getExpectedReturnDate())
                .status(AllocationStatus.ACTIVE)
                .allocatedBy(approver)
                .build();

        allocationRepository.save(newAllocation);

        // Save the updated transfer request
        TransferRequest saved = transferRequestRepository.save(transferRequest);

        log.info("Transfer request {} approved: asset transferred from {} to {}",
                transferRequestId,
                oldAllocation.getHolder().getName(),
                transferRequest.getRequestedTo().getName());

        return mapToResponse(saved);
    }

    /**
     * Reject a transfer request.
     *
     * @param transferRequestId the transfer request ID
     * @param approver the user rejecting the transfer
     * @return the rejected transfer request as TransferRequestResponse
     * @throws TransferRequestNotFoundException if transfer request not found
     * @throws InvalidAllocationStateException if transfer request status is not REQUESTED
     */
    @Transactional
    public TransferRequestResponse reject(UUID transferRequestId, User approver) {
        // Load transfer request
        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new TransferRequestNotFoundException(
                        "Transfer request with ID " + transferRequestId + " not found"
                ));

        if (transferRequest.getStatus() != TransferRequestStatus.REQUESTED) {
            throw new InvalidAllocationStateException(
                    String.format("Transfer request status is %s, cannot reject. Only REQUESTED requests can be rejected.",
                            transferRequest.getStatus())
            );
        }

        // Mark as rejected
        transferRequest.setStatus(TransferRequestStatus.REJECTED);
        transferRequest.setApprovedBy(approver);
        transferRequest.setResolvedAt(Instant.now());

        TransferRequest saved = transferRequestRepository.save(transferRequest);
        log.info("Transfer request {} rejected by {}", transferRequestId, approver.getName());
        return mapToResponse(saved);
    }

    /**
     * Get transfer request by ID.
     *
     * @param id the transfer request ID
     * @return the transfer request as TransferRequestResponse
     * @throws TransferRequestNotFoundException if not found
     */
    @Transactional(readOnly = true)
    public TransferRequestResponse getById(UUID id) {
        TransferRequest transferRequest = transferRequestRepository.findById(id)
                .orElseThrow(() -> new TransferRequestNotFoundException(
                        "Transfer request with ID " + id + " not found"
                ));
        return mapToResponse(transferRequest);
    }

    /**
     * List all transfer requests with optional status filter.
     *
     * @param status optional status filter (if null, returns all)
     * @return list of transfer requests
     */
    @Transactional(readOnly = true)
    public List<TransferRequestResponse> listByStatus(TransferRequestStatus status) {
        List<TransferRequest> requests;
        if (status != null) {
            requests = transferRequestRepository.findByStatus(status);
        } else {
            requests = transferRequestRepository.findAll();
        }

        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Maps a TransferRequest entity to its DTO representation.
     *
     * @param transferRequest the transfer request entity
     * @return the transfer request as TransferRequestResponse
     */
    private TransferRequestResponse mapToResponse(TransferRequest transferRequest) {
        return new TransferRequestResponse(
                transferRequest.getId(),
                transferRequest.getAllocation().getId(),
                transferRequest.getAllocation().getAsset().getAssetTag(),
                transferRequest.getRequestedBy().getName(),
                transferRequest.getRequestedTo().getName(),
                transferRequest.getStatus(),
                transferRequest.getCreatedAt(),
                transferRequest.getResolvedAt()
        );
    }
}
