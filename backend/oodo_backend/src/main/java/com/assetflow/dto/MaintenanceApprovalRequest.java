package com.assetflow.dto;

import java.util.UUID;

public record MaintenanceApprovalRequest(
        UUID technicianId
) {
}
