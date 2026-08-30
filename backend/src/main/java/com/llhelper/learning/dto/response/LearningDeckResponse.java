package com.llhelper.learning.dto.response;

import com.llhelper.common.model.Language;
import java.time.Instant;

public record LearningDeckResponse(
    Long deckId,
    String title,
    Language sourceLanguage,
    Language targetLanguage,
    Instant enrolledAt,
    Instant lastStudiedAt,
    ProgressSummary progress
) {

    public record ProgressSummary(
        long masteredCount,
        long totalCount
    ) {
    }
}
