package com.assetflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String message,
        Map<String, String> errors
) {
    public ErrorResponse(LocalDateTime timestamp, int status, String message) {
        this(timestamp, status, message, null);
    }
}
