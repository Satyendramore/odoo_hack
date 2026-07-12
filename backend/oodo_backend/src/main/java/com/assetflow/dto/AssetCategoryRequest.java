package com.assetflow.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public record AssetCategoryRequest(
        @NotBlank(message = "Category name is required")
        String name,

        Map<String, Object> customFields
) {
}
