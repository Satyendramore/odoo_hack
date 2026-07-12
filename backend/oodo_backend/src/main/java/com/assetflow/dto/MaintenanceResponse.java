package com.assetflow.dto;

import com.assetflow.enums.MaintenancePriority;
import com.assetflow.enums.MaintenanceStatus;

import java.time.Instant;
import java.util.UUID;

public record MaintenanceResponse(
        UUID id,
        UUID assetId,
        String assetTag,
        String raisedByName,
        String issueDescription,
        MaintenancePriority priority,
        String photoUrl,
        MaintenanceStatus status,
        String approvedByName,
        String technicianName,
        String resolutionNotes,
        Instant createdAt,
        Instant resolvedAt
) {
}
