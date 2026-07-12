package com.assetflow.dto;

import com.assetflow.enums.AssetStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AssetResponse(
        UUID id,
        String assetTag,
        String name,
        String categoryName,
        UUID categoryId,
        String serialNumber,
        LocalDate acquisitionDate,
        BigDecimal acquisitionCost,
        String condition,
        String location,
        String departmentName,
        UUID departmentId,
        AssetStatus status,
        boolean isBookable,
        String photoUrl,
        Instant createdAt
) {
}
