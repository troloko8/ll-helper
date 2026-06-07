package com.llhelper.card_desc.dto.response;

import com.llhelper.user.dto.response.UserResponse;
import java.time.LocalDateTime;

public record CardDescListResponse(
    Long id,
    String title,
    String description,
    String sourceLanguage,
    String targetLanguage,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    UserResponse owner,
    Boolean isPublic
    // FIXME: add cardCount
    // Integer cardCount
) {
}
