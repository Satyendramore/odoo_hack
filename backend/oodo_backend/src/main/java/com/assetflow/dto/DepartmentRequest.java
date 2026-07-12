package com.assetflow.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record DepartmentRequest(
        @NotBlank(message = "Department name is required")
        String name,

        UUID headId,

        UUID parentDepartmentId
) {
}
