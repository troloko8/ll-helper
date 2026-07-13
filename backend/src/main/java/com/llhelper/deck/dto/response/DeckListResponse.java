package com.llhelper.deck.dto.response;

import com.llhelper.common.model.Language;
import com.llhelper.user.dto.response.UserResponse;
import java.time.Instant;

public record DeckListResponse(
    Long id,
    String title,
    String description,
    Language sourceLanguage,
    Language targetLanguage,
    Instant createdAt,
    Instant updatedAt,
    UserResponse owner,
    Boolean isPublic
    // FIXME: add cardCount
    // Integer cardCount
) {
}
