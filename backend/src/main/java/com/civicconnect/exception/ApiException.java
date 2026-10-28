package com.civicconnect.exception;

import org.springframework.http.HttpStatus;

/**
 * Custom application runtime exception holding HTTP status code and message.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
