package com.llhelper.user.model;

public final class InvalidUsernameSlugException extends IllegalArgumentException {

    public InvalidUsernameSlugException(String message) {
        super(message);
    }
}
