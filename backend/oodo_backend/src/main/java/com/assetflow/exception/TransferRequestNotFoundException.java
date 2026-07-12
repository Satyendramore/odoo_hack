package com.assetflow.exception;

public class TransferRequestNotFoundException extends RuntimeException {
    public TransferRequestNotFoundException(String message) {
        super(message);
    }
}
