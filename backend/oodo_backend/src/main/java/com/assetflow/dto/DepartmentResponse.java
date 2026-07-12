package com.assetflow.dto;

import com.assetflow.enums.Status;

import java.util.UUID;

public record DepartmentResponse(
        UUID id,
        String name,
        String headName,
        UUID headId,
        String parentDepartmentName,
        UUID parentDepartmentId,
        Status status
) {
}
