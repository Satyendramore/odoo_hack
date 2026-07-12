package com.assetflow.dto;

import com.assetflow.enums.TransferRequestStatus;
import java.time.Instant;
import java.util.UUID;

public record TransferRequestResponse(
        UUID id,
        UUID allocationId,
        String assetTag,
        String requestedByName,
        String requestedToName,
        TransferRequestStatus status,
        Instant createdAt,
        Instant resolvedAt
) {
}
