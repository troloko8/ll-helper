package com.llhelper.deck.dto.response;

import com.llhelper.common.model.Language;

public record OwnedDeckListResponse(
    Long id,
    String title,
    Language sourceLanguage,
    Language targetLanguage,
    boolean isPublic,
    long cardCount
) {
}
