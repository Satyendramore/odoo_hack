package com.assetflow.dto;

import com.assetflow.enums.Role;
import jakarta.validation.constraints.NotNull;

public record RolePromotionRequest(
        @NotNull(message = "Role is required for promotion")
        Role role
) {
}
