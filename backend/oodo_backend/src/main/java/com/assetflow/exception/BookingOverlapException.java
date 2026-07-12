package com.assetflow.exception;

import java.time.Instant;

/**
 * Exception thrown when a booking request overlaps with an existing booking.
 * Includes structured data about the conflicting booking for frontend UI.
 */
public class BookingOverlapException extends RuntimeException {
    private final Instant conflictingStart;
    private final Instant conflictingEnd;

    public BookingOverlapException(String message, Instant conflictingStart, Instant conflictingEnd) {
        super(message);
        this.conflictingStart = conflictingStart;
        this.conflictingEnd = conflictingEnd;
    }

    public Instant getConflictingStart() {
        return conflictingStart;
    }

    public Instant getConflictingEnd() {
        return conflictingEnd;
    }
}
