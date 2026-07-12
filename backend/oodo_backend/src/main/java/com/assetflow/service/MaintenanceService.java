package com.assetflow.service;

import com.assetflow.dto.AssetStatusUpdateRequest;
import com.assetflow.dto.MaintenanceApprovalRequest;
import com.assetflow.dto.MaintenanceRequestCreate;
import com.assetflow.dto.MaintenanceResponse;
import com.assetflow.dto.MaintenanceResolveRequest;
import com.assetflow.entity.Asset;
import com.assetflow.entity.MaintenanceRequest;
import com.assetflow.entity.User;
import com.assetflow.enums.AssetStatus;
import com.assetflow.enums.MaintenancePriority;
import com.assetflow.enums.MaintenanceStatus;
import com.assetflow.exception.*;
import com.assetflow.repository.AssetRepository;
import com.assetflow.repository.MaintenanceRequestRepository;
import com.assetflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceService {

    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final AssetService assetService;

    /**
     * Raise a new maintenance request for an asset.
     * Does not change the asset status — that only happens on approval.
     *
     * @param request the maintenance request details
     * @param currentUser the user raising the request
     * @return the created maintenance request as MaintenanceResponse
     * @throws AssetNotFoundException if asset not found
     */
    @Transactional
    public MaintenanceResponse raise(MaintenanceRequestCreate request, User currentUser) {
        // Load asset
        Asset asset = assetRepository.findById(request.assetId())
                .orElseThrow(() -> new AssetNotFoundException(
                        "Asset with ID " + request.assetId() + " not found"
                ));

        // Create maintenance request
        MaintenanceRequest maintenance = MaintenanceRequest.builder()
                .asset(asset)
                .raisedBy(currentUser)
                .issueDescription(request.issueDescription())
                .priority(request.priority() != null ? request.priority() : MaintenancePriority.MEDIUM)
                .photoUrl(request.photoUrl())
                .status(MaintenanceStatus.PENDING)
                .build();

        MaintenanceRequest saved = maintenanceRequestRepository.save(maintenance);
        log.info("Maintenance request raised: asset {} by user {}, priority {}",
                asset.getAssetTag(), currentUser.getName(), saved.getPriority());
        return mapToResponse(saved);
    }

    /**
     * Approve a maintenance request and optionally assign a technician.
     * Transitions the asset to UNDER_MAINTENANCE status.
     *
     * @param requestId the maintenance request ID
     * @param approval the approval details (may include technicianId)
     * @param approver the user approving the request
     * @return the approved maintenance request as MaintenanceResponse
     * @throws MaintenanceRequestNotFoundException if request not found
     * @throws InvalidMaintenanceStateException if status is not PENDING
     */
    @Transactional
    public MaintenanceResponse approve(UUID requestId, MaintenanceApprovalRequest approval, User approver) {
        // Load maintenance request
        MaintenanceRequest maintenance = maintenanceRequestRepository.findById(requestId)
                .orElseThrow(() -> new MaintenanceRequestNotFoundException(
                        "Maintenance request with ID " + requestId + " not found"
                ));

        // Verify status is PENDING
        if (maintenance.getStatus() != MaintenanceStatus.PENDING) {
            throw new InvalidMaintenanceStateException(
                    String.format("Cannot approve maintenance request with status %s", maintenance.getStatus())
            );
        }

        // Set approval details
        maintenance.setStatus(MaintenanceStatus.APPROVED);
        maintenance.setApprovedBy(approver);

        // Assign technician if provided
        if (approval.technicianId() != null) {
            User technician = userRepository.findById(approval.technicianId())
                    .orElseThrow(() -> new UserNotFoundException(
                            "User with ID " + approval.technicianId() + " not found"
                    ));
            maintenance.setTechnician(technician);
        }

        // Move asset to UNDER_MAINTENANCE
        assetService.updateStatus(maintenance.getAsset().getId(), new AssetStatusUpdateRequest(AssetStatus.UNDER_MAINTENANCE));

        MaintenanceRequest updated = maintenanceRequestRepository.save(maintenance);
        log.info("Maintenance request approved: {} by {}", requestId, approver.getName());
        return mapToResponse(updated);
    }

    /**
     * Reject a maintenance request.
     * Asset status does not change.
     *
     * @param requestId the maintenance request ID
     * @param approver the user rejecting the request
     * @return the rejected maintenance request as MaintenanceResponse
     * @throws MaintenanceRequestNotFoundException if request not found
     * @throws InvalidMaintenanceStateException if status is not PENDING
     */
    @Transactional
    public MaintenanceResponse reject(UUID requestId, User approver) {
        // Load maintenance request
        MaintenanceRequest maintenance = maintenanceRequestRepository.findById(requestId)
                .orElseThrow(() -> new MaintenanceRequestNotFoundException(
                        "Maintenance request with ID " + requestId + " not found"
                ));

        // Verify status is PENDING
        if (maintenance.getStatus() != MaintenanceStatus.PENDING) {
            throw new InvalidMaintenanceStateException(
                    String.format("Cannot reject maintenance request with status %s", maintenance.getStatus())
            );
        }

        // Set rejection details
        maintenance.setStatus(MaintenanceStatus.REJECTED);
        maintenance.setApprovedBy(approver);

        MaintenanceRequest updated = maintenanceRequestRepository.save(maintenance);
        log.info("Maintenance request rejected: {} by {}", requestId, approver.getName());
        return mapToResponse(updated);
    }

    /**
     * Start work on an approved maintenance request.
     * Moves status from APPROVED to IN_PROGRESS.
     * Assigns technician if not already set.
     *
     * @param requestId the maintenance request ID
     * @param technicianId the technician user ID
     * @param currentUser the user starting progress
     * @return the updated maintenance request as MaintenanceResponse
     * @throws MaintenanceRequestNotFoundException if request not found
     * @throws InvalidMaintenanceStateException if status is not APPROVED
     */
    @Transactional
    public MaintenanceResponse startProgress(UUID requestId, UUID technicianId, User currentUser) {
        // Load maintenance request
        MaintenanceRequest maintenance = maintenanceRequestRepository.findById(requestId)
                .orElseThrow(() -> new MaintenanceRequestNotFoundException(
                        "Maintenance request with ID " + requestId + " not found"
                ));

        // Verify status is APPROVED or IN_PROGRESS
        if (maintenance.getStatus() != MaintenanceStatus.APPROVED && 
            maintenance.getStatus() != MaintenanceStatus.IN_PROGRESS) {
            throw new InvalidMaintenanceStateException(
                    String.format("Cannot start progress on maintenance request with status %s", maintenance.getStatus())
            );
        }

        // Assign technician if not already set
        if (maintenance.getTechnician() == null) {
            User technician = userRepository.findById(technicianId)
                    .orElseThrow(() -> new UserNotFoundException(
                            "User with ID " + technicianId + " not found"
                    ));
            maintenance.setTechnician(technician);
        }

        maintenance.setStatus(MaintenanceStatus.IN_PROGRESS);
        MaintenanceRequest updated = maintenanceRequestRepository.save(maintenance);
        log.info("Maintenance progress started: {} by {}", requestId, currentUser.getName());
        return mapToResponse(updated);
    }

    /**
     * Resolve a maintenance request.
     * Transitions the asset back to AVAILABLE status.
     *
     * @param requestId the maintenance request ID
     * @param resolveRequest the resolution details (includes resolutionNotes)
     * @param currentUser the user resolving the request
     * @return the resolved maintenance request as MaintenanceResponse
     * @throws MaintenanceRequestNotFoundException if request not found
     * @throws InvalidMaintenanceStateException if status is not IN_PROGRESS or APPROVED
     */
    @Transactional
    public MaintenanceResponse resolve(UUID requestId, MaintenanceResolveRequest resolveRequest, User currentUser) {
        // Load maintenance request
        MaintenanceRequest maintenance = maintenanceRequestRepository.findById(requestId)
                .orElseThrow(() -> new MaintenanceRequestNotFoundException(
                        "Maintenance request with ID " + requestId + " not found"
                ));

        // Verify status is IN_PROGRESS or APPROVED (allow both for flexibility)
        if (maintenance.getStatus() != MaintenanceStatus.IN_PROGRESS && 
            maintenance.getStatus() != MaintenanceStatus.APPROVED) {
            throw new InvalidMaintenanceStateException(
                    String.format("Cannot resolve maintenance request with status %s", maintenance.getStatus())
            );
        }

        // Set resolution details
        maintenance.setStatus(MaintenanceStatus.RESOLVED);
        maintenance.setResolutionNotes(resolveRequest.resolutionNotes());
        maintenance.setResolvedAt(Instant.now());

        // Move asset back to AVAILABLE
        assetService.updateStatus(maintenance.getAsset().getId(), new AssetStatusUpdateRequest(AssetStatus.AVAILABLE));

        MaintenanceRequest updated = maintenanceRequestRepository.save(maintenance);
        log.info("Maintenance request resolved: {} by {}", requestId, currentUser.getName());
        return mapToResponse(updated);
    }

    /**
     * Get maintenance history for an asset (most recent first).
     *
     * @param assetId the asset ID
     * @return list of maintenance requests for the asset
     */
    @Transactional(readOnly = true)
    public List<MaintenanceResponse> getHistory(UUID assetId) {
        List<MaintenanceRequest> requests = maintenanceRequestRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all maintenance requests.
     *
     * @return list of all maintenance requests
     */
    @Transactional(readOnly = true)
    public List<MaintenanceResponse> getAll() {
        List<MaintenanceRequest> requests = maintenanceRequestRepository.findAll();
        // Sort by createdAt descending
        requests.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Maps a MaintenanceRequest entity to its DTO representation.
     *
     * @param maintenance the maintenance request entity
     * @return the maintenance request as MaintenanceResponse
     */
    private MaintenanceResponse mapToResponse(MaintenanceRequest maintenance) {
        return new MaintenanceResponse(
                maintenance.getId(),
                maintenance.getAsset().getId(),
                maintenance.getAsset().getAssetTag(),
                maintenance.getRaisedBy().getName(),
                maintenance.getIssueDescription(),
                maintenance.getPriority(),
                maintenance.getPhotoUrl(),
                maintenance.getStatus(),
                maintenance.getApprovedBy() != null ? maintenance.getApprovedBy().getName() : null,
                maintenance.getTechnician() != null ? maintenance.getTechnician().getName() : null,
                maintenance.getResolutionNotes(),
                maintenance.getCreatedAt(),
                maintenance.getResolvedAt()
        );
    }
}
