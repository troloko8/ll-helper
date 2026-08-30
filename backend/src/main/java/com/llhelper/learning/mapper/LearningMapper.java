package com.llhelper.learning.mapper;

import com.llhelper.card.entity.Card;
import com.llhelper.deck.entity.Deck;
import com.llhelper.learning.dto.response.CardReviewResponse;
import com.llhelper.learning.dto.response.DeckCardResponse;
import com.llhelper.learning.dto.response.LearningDeckResponse;
import com.llhelper.learning.entity.UserCardProgress;
import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.CardLearningStatus;
import java.time.Instant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.stereotype.Component;

/**
 * MapStruct mapper for Learning module.
 * Handles mapping for UserDeckProgress, UserCardProgress, and DeckCardResponse.
 * Generated implementation is auto-injected as Spring bean.
 */
@Component
@Mapper(componentModel = "spring")
public interface LearningMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "deckId", source = "deckId")
    @Mapping(target = "enrolledAt", source = "enrolledAt")
    @Mapping(target = "lastStudiedAt", ignore = true)
    @Mapping(target = "status", constant = "ACTIVE")
    UserDeckProgress toUserDeckProgress(Long userId, Long deckId, Instant enrolledAt);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "cardId", source = "cardId")
    @Mapping(target = "userDeckProgressId", source = "userDeckProgressId")
    @Mapping(target = "timesSeen", constant = "0")
    @Mapping(target = "timesCorrect", constant = "0")
    @Mapping(target = "timesWrong", constant = "0")
    @Mapping(target = "correctStreak", constant = "0")
    @Mapping(target = "difficultyLevel", ignore = true)
    @Mapping(target = "lastReviewedAt", ignore = true)
    @Mapping(target = "nextReviewAt", ignore = true)
    @Mapping(target = "status", constant = "NEW")
    UserCardProgress toUserCardProgress(Long userId, Long cardId, Long userDeckProgressId);

    @Mapping(target = "id", source = "card.id")
    @Mapping(target = "title", source = "card.title")
    @Mapping(target = "definition", source = "card.definition")
    @Mapping(target = "synonyms", source = "card.synonyms")
    @Mapping(target = "examples", source = "card.examples")
    @Mapping(target = "translation", source = "card.translation")
    @Mapping(target = "progress", source = "progress")
    DeckCardResponse toDeckCardResponse(Card card, UserCardProgress progress);

    @Mapping(target = "status", source = "status")
    @Mapping(target = "timesSeen", source = "timesSeen")
    @Mapping(target = "timesCorrect", source = "timesCorrect")
    @Mapping(target = "timesWrong", source = "timesWrong")
    @Mapping(target = "correctStreak", source = "correctStreak")
    DeckCardResponse.CardProgressInfo toCardProgressInfo(UserCardProgress progress);

    @Mapping(target = "deckId", source = "deckProgress.deckId")
    @Mapping(target = "title", source = "deck.title")
    @Mapping(target = "sourceLanguage", source = "deck.sourceLanguage")
    @Mapping(target = "targetLanguage", source = "deck.targetLanguage")
    @Mapping(target = "enrolledAt", source = "deckProgress.enrolledAt")
    @Mapping(target = "lastStudiedAt", source = "deckProgress.lastStudiedAt")
    @Mapping(target = "progress", source = "progress")
    LearningDeckResponse toLearningDeckResponse(
        UserDeckProgress deckProgress,
        Deck deck,
        LearningDeckResponse.ProgressSummary progress
    );

    @Mapping(target = "correct", source = "isCorrect")
    @Mapping(target = "correctAnswer", source = "card.title")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "correctStreak", source = "progress.correctStreak")
    @Mapping(target = "totalCorrect", source = "progress.timesCorrect")
    CardReviewResponse toCardReviewResponse(boolean isCorrect, Card card, CardLearningStatus status, UserCardProgress progress);
}
