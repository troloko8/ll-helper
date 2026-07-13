package com.llhelper.card.dto.response;

import java.time.Instant;
import java.util.List;

public record CardResponse(
    Long id,
    Long deckId,
    String title,
    String definition,
    List<String> synonyms,
    List<String> examples,
    String translation,
    Instant createdAt,
    Instant updatedAt
) {
}
