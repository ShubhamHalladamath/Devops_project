package com.attendance.exception;

public class AlreadyMarkedException extends RuntimeException {
    public AlreadyMarkedException(String message) {
        super(message);
    }
}
