package com.llhelper.learning.dto.response;

import com.llhelper.common.model.Language;
import java.time.Instant;
import java.util.List;

public record LearningDeckDetailsResponse(
    Long deckId,
    String title,
    Language sourceLanguage,
    Language targetLanguage,
    Instant enrolledAt,
    Instant lastStudiedAt,
    LearningDeckResponse.ProgressSummary progress,
    List<DeckCardResponse> cards
) {
}
