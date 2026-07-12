package com.assetflow.dto;

import jakarta.validation.constraints.NotBlank;

public record MaintenanceResolveRequest(
        @NotBlank(message = "Resolution notes cannot be blank")
        String resolutionNotes
) {
}
