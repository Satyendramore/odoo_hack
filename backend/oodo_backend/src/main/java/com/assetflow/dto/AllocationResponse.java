package com.assetflow.dto;

import com.assetflow.enums.AllocationStatus;
import java.time.LocalDate;
import java.util.UUID;

public record AllocationResponse(
        UUID id,
        UUID assetId,
        String assetTag,
        UUID holderId,
        String holderName,
        LocalDate allocatedDate,
        LocalDate expectedReturnDate,
        LocalDate returnedDate,
        AllocationStatus status,
        String allocatedByName
) {
}
