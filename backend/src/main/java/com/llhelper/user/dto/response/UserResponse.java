package com.llhelper.user.dto.response;

import java.time.Instant;

public record UserResponse(
    Long id,
    String username,
    String firstName,
    String lastName,
    String nativeLanguage,
    String targetLanguage,
    String avatarUrl,
    String uiLanguage,
    Instant createdAt,
    Instant updatedAt
) {
}
