package com.assetflow.dto;

import com.assetflow.enums.Role;
import com.assetflow.enums.Status;

import java.util.UUID;

public record EmployeeResponse(
        UUID id,
        String name,
        String email,
        Role role,
        String departmentName,
        UUID departmentId,
        Status status
) {
}
