package com.assetflow.dto;

import com.assetflow.enums.AssetStatus;
import jakarta.validation.constraints.NotNull;

public record AssetStatusUpdateRequest(
        @NotNull(message = "Status cannot be null")
        AssetStatus status
) {
}
