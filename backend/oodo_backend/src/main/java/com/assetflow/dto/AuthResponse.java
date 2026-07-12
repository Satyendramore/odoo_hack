package com.assetflow.dto;

import com.assetflow.enums.Role;

import java.util.UUID;

public record AuthResponse(
        String token,
        UUID userId,
        String name,
        String email,
        Role role
) {
}
