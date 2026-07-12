package com.assetflow.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AssetRegistrationRequest(
        @NotNull(message = "Category ID cannot be null")
        UUID categoryId,

        String serialNumber,

        LocalDate acquisitionDate,

        @DecimalMin(value = "0", message = "Acquisition cost must be zero or positive")
        BigDecimal acquisitionCost,

        String condition,

        @NotBlank(message = "Location cannot be blank")
        String location,

        UUID departmentId,

        boolean isBookable,

        String photoUrl
) {
}
