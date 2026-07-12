package com.assetflow.dto;

import com.assetflow.enums.BookingStatus;
import java.time.Instant;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID assetId,
        String assetTag,
        String bookedByName,
        Instant startTime,
        Instant endTime,
        BookingStatus status,
        String purpose,
        Instant createdAt
) {
}
