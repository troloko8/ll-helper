package com.llhelper.user.support;

import com.llhelper.user.dto.request.UpdateUserRequest;

public final class UserTestData {
    public static final Long USER_ID = 1L;

    public static UpdateUserRequest defaultUpdateRequest() {
        return new UpdateUserRequest("First", "Last", "en", "ru", null, "en");
    }

    public static UpdateUserRequest blankFirstNameUpdateRequest() {
        return new UpdateUserRequest("", "Last", "en", "ru", null, "en");
    }

}
