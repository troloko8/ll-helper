package com.llhelper.learning.dto.response;

import com.llhelper.learning.enums.CardLearningStatus;
import java.util.List;

public record DeckCardResponse(
    Long id,
    String title,
    String definition,
    List<String> synonyms,
    List<String> examples,
    String translation,
    CardProgressInfo progress
) {

    public record CardProgressInfo(
        CardLearningStatus status,
        Integer timesSeen,
        Integer timesCorrect,
        Integer timesWrong,
        Integer correctStreak
    ) {
    }
}
