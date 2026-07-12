package com.assetflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Extended error response for AssetAlreadyAllocatedException.
 * Includes structured metadata to guide frontend action.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponseWithMetadata(
        LocalDateTime timestamp,
        int status,
        String message,
        Map<String, String> errors,
        String currentHolder,
        String suggestedAction
) {
    public ErrorResponseWithMetadata(LocalDateTime timestamp, int status, String message) {
        this(timestamp, status, message, null, null, null);
    }

    public ErrorResponseWithMetadata(LocalDateTime timestamp, int status, String message, String currentHolder, String suggestedAction) {
        this(timestamp, status, message, null, currentHolder, suggestedAction);
    }
}
