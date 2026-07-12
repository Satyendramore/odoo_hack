package com.assetflow.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record BookingRequest(
        @NotNull(message = "Asset ID cannot be null")
        UUID assetId,

        @NotNull(message = "Start time cannot be null")
        @Future(message = "Start time must be in the future")
        Instant startTime,

        @NotNull(message = "End time cannot be null")
        @Future(message = "End time must be in the future")
        Instant endTime,

        String purpose
) {
    /**
     * Validates that endTime is strictly after startTime.
     * This is checked at the DTO level to provide immediate validation feedback.
     */
    public BookingRequest {
        if (startTime != null && endTime != null && !endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("End time must be strictly after start time");
        }
    }
}
