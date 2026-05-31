package com.llhelper.learning.dto.response;

import com.llhelper.learning.enums.CardLearningStatus;

public record CardReviewResponse(
    boolean correct,
    String correctAnswer,
    CardLearningStatus status,
    Integer correctStreak,
    Integer totalCorrect
) {
}
