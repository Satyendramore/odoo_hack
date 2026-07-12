package com.assetflow.dto;

import java.util.Map;
import java.util.UUID;

public record AssetCategoryResponse(
        UUID id,
        String name,
        Map<String, Object> customFields
) {
}
