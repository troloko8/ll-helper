package com.llhelper.learning.dto.response;

import com.llhelper.common.model.Language;

public record LearningProgressResponse(
    Long deckId,
    String title,
    Language sourceLanguage,
    Language targetLanguage,
    StatusCounts cardsByStatus,
    long totalCards
) {

    public record StatusCounts(
        long newCount,
        long learningCount,
        long reviewingCount,
        long masteredCount
    ) {
    }
}
