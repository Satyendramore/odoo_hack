package com.assetflow.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record TransferRequestCreateRequest(
        @NotNull(message = "Requested to user ID cannot be null")
        UUID requestedToId
) {
}
