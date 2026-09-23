package com.llhelper.deck.dto.response;

import com.llhelper.common.model.Language;
import com.llhelper.user.dto.response.UserResponse;

public record PublicDeckListResponse(
    Long id,
    String title,
    Language sourceLanguage,
    Language targetLanguage,
    UserResponse owner,
    long cardCount,
    boolean isEnrolled
) {
}
