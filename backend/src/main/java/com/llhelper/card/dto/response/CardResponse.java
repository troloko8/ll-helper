package com.llhelper.card.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record CardResponse(
    Long id,
    Long deckId,
    String title,
    String definition,
    List<String> synonyms,
    List<String> examples,
    String translation,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
