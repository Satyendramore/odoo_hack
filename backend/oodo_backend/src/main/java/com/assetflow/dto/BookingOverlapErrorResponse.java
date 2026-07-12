package com.assetflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Extended error response for BookingOverlapException.
 * Includes structured data about the conflicting booking so frontend can highlight it on the calendar.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record BookingOverlapErrorResponse(
        LocalDateTime timestamp,
        int status,
        String message,
        Instant conflictingStart,
        Instant conflictingEnd
) {
}
