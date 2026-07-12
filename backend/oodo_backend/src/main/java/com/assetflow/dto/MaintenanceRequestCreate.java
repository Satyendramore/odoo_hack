package com.assetflow.dto;

import com.assetflow.enums.MaintenancePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record MaintenanceRequestCreate(
        @NotNull(message = "Asset ID cannot be null")
        UUID assetId,

        @NotBlank(message = "Issue description cannot be blank")
        String issueDescription,

        MaintenancePriority priority,

        String photoUrl
) {
}
