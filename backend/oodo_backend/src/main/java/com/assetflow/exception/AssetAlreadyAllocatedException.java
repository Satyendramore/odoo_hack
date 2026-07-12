package com.assetflow.exception;

/**
 * Exception thrown when an asset is already allocated.
 * Includes structured metadata for frontend to suggest transfer request flow.
 */
public class AssetAlreadyAllocatedException extends RuntimeException {
    private final String currentHolder;

    public AssetAlreadyAllocatedException(String message, String currentHolder) {
        super(message);
        this.currentHolder = currentHolder;
    }

    public String getCurrentHolder() {
        return currentHolder;
    }
}
