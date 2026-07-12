package com.assetflow.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record AllocationRequest(
        @NotNull(message = "Asset ID cannot be null")
        UUID assetId,

        @NotNull(message = "Holder ID cannot be null")
        UUID holderId,

        LocalDate expectedReturnDate
) {
}
