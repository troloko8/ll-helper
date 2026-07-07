package com.llhelper.deck.dto.response;

import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.common.model.Language;
import com.llhelper.user.dto.response.UserResponse;
import java.time.LocalDateTime;
import java.util.List;

public record DeckResponse(
    Long id,
    String title,
    String description,
    Language sourceLanguage,
    Language targetLanguage,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    UserResponse owner,
    Boolean isPublic,
    List<CardResponse> cards
) {
}
