package com.assetflow.exception;

public class AssetNotBookableException extends RuntimeException {
    public AssetNotBookableException(String message) {
        super(message);
    }
}
