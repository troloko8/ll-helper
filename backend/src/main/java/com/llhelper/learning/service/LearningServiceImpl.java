package com.llhelper.learning.service;

import com.llhelper.card.entity.Card;
import com.llhelper.card.repository.CardRepository;
import com.llhelper.card_desc.entity.CardDesc;
import com.llhelper.card_desc.repository.CardDescRepository;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.learning.dto.request.CardReviewRequest;
import com.llhelper.learning.dto.response.CardReviewResponse;
import com.llhelper.learning.dto.response.DeckCardResponse;
import com.llhelper.learning.entity.UserCardProgress;
import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.CardLearningStatus;
import com.llhelper.learning.enums.UserDeckStatus;
import com.llhelper.learning.repository.UserCardProgressRepository;
import com.llhelper.learning.repository.UserDeckProgressRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LearningServiceImpl implements LearningService {

    private final UserDeckProgressRepository userDeckProgressRepository;
    private final UserCardProgressRepository userCardProgressRepository;
    private final CardDescRepository cardDescRepository;
    private final CardRepository cardRepository;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional
    public void enrollDeck(Long deckId) {
        Long userId = securityUtils.getCurrentUserId();

        if (userDeckProgressRepository.existsByUserIdAndDeckId(userId, deckId)) {
            throw new IllegalStateException("Deck already enrolled");
        }

        CardDesc deck = cardDescRepository.findById(deckId)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + deckId));

        if (!Boolean.TRUE.equals(deck.getIsPublic())) {
            throw new AccessDeniedException("Access denied: Deck is not public");
        }

        UserDeckProgress progress = new UserDeckProgress();
        progress.setUserId(userId);
        progress.setDeckId(deckId);
        progress.setLastStudiedAt(null);
        progress.setStatus(UserDeckStatus.ACTIVE);

        userDeckProgressRepository.save(progress);

        // Create UserCardProgress for all cards in the deck with NEW status
        List<UserCardProgress> cardProgressList = deck.getCards().stream()
            .map(card -> {
                UserCardProgress cardProgress = new UserCardProgress();
                cardProgress.setUserId(userId);
                cardProgress.setCardId(card.getId());
                cardProgress.setUserDeckProgressId(progress.getId());
                cardProgress.setTimesSeen(0);
                cardProgress.setTimesCorrect(0);
                cardProgress.setTimesWrong(0);
                cardProgress.setCorrectStreak(0);
                cardProgress.setStatus(CardLearningStatus.NEW);
                return cardProgress;
            })
            .collect(Collectors.toList());

        userCardProgressRepository.saveAll(cardProgressList);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckCardResponse> getStudyCards(Long deckId) {
        Long userId = securityUtils.getCurrentUserId();

        UserDeckProgress deckProgress = userDeckProgressRepository.findByUserIdAndDeckId(userId, deckId)
            .orElseThrow(() -> new IllegalStateException("Deck not enrolled. Please enroll first."));

        List<UserCardProgress> allCardProgress = userCardProgressRepository.findAllByUserDeckProgressId(deckProgress.getId());

        // Get all card IDs for batch loading
        List<Long> cardIds = allCardProgress.stream()
            .map(UserCardProgress::getCardId)
            .collect(Collectors.toList());

        // Load all cards in one query
        Map<Long, Card> cardMap = cardRepository.findAllById(cardIds).stream()
            .collect(Collectors.toMap(Card::getId, card -> card));

        // Priority 1: LEARNING cards
        List<UserCardProgress> learningCards = allCardProgress.stream()
            .filter(p -> p.getStatus() == CardLearningStatus.LEARNING)
            .sorted(Comparator.comparing(UserCardProgress::getCardId))
            .limit(10)
            .collect(Collectors.toList());

        // Priority 2: NEW cards (if less than 10 learning cards)
        if (learningCards.size() < 10) {
            int remaining = 10 - learningCards.size();
            
            List<UserCardProgress> newCards = allCardProgress.stream()
                .filter(p -> p.getStatus() == CardLearningStatus.NEW)
                .sorted(Comparator.comparing(UserCardProgress::getCardId))
                .limit(remaining)
                .toList();
            
            learningCards.addAll(newCards);
        }

        return learningCards.stream()
            .map(p -> toDeckCardResponse(p, cardMap.get(p.getCardId())))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckCardResponse> getDeckCards(Long deckId) {
        Long userId = securityUtils.getCurrentUserId();

        UserDeckProgress deckProgress = userDeckProgressRepository.findByUserIdAndDeckId(userId, deckId)
            .orElseThrow(() -> new IllegalStateException("Deck not enrolled. Please enroll first."));

        List<UserCardProgress> allCardProgress = userCardProgressRepository.findAllByUserDeckProgressId(deckProgress.getId());

        // Get all card IDs for batch loading
        List<Long> cardIds = allCardProgress.stream()
            .map(UserCardProgress::getCardId)
            .collect(Collectors.toList());

        // Load all cards in one query
        Map<Long, Card> cardMap = cardRepository.findAllById(cardIds).stream()
            .collect(Collectors.toMap(Card::getId, card -> card));

        return allCardProgress.stream()
            .map(p -> toDeckCardResponse(p, cardMap.get(p.getCardId())))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CardReviewResponse reviewCard(Long cardId, CardReviewRequest request) {
        // FIXME: maybe better to send userId from controller hence from frontend
        Long userId = securityUtils.getCurrentUserId();

        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new EntityNotFoundException("Card not found: " + cardId));

        CardDesc deck = card.getCardDesc();

        UserDeckProgress deckProgress = userDeckProgressRepository.findByUserIdAndDeckId(userId, deck.getId())
            .orElseThrow(() -> new IllegalStateException("Deck not enrolled. Please enroll first."));

        UserCardProgress cardProgress = userCardProgressRepository.findByUserDeckProgressIdAndCardId(deckProgress.getId(), cardId)
            .orElseThrow(() -> new IllegalStateException("Card progress not found. Please enroll first."));

        boolean isCorrect = request.userAnswer().trim().equalsIgnoreCase(card.getTitle().trim());

        cardProgress.setTimesSeen(cardProgress.getTimesSeen() + 1);
        cardProgress.setLastReviewedAt(LocalDateTime.now());

        if (isCorrect) {
            cardProgress.setTimesCorrect(cardProgress.getTimesCorrect() + 1);
            cardProgress.setCorrectStreak(cardProgress.getCorrectStreak() + 1);
        } else {
            cardProgress.setTimesWrong(cardProgress.getTimesWrong() + 1);
            cardProgress.setCorrectStreak(0);
        }

        CardLearningStatus newStatus = calculateStatus(cardProgress);
        cardProgress.setStatus(newStatus);

        userCardProgressRepository.save(cardProgress);

        deckProgress.setLastStudiedAt(LocalDateTime.now());
        userDeckProgressRepository.save(deckProgress);

        return new CardReviewResponse(
            isCorrect,
            card.getTitle(),
            newStatus,
            cardProgress.getCorrectStreak(),
            cardProgress.getTimesCorrect()
        );
    }

    private CardLearningStatus calculateStatus(UserCardProgress progress) {
        if (progress.getCorrectStreak() >= 3) {
            return CardLearningStatus.MASTERED;
        } else if (progress.getTimesCorrect() >= 2) {
            return CardLearningStatus.REVIEWING;
        } else if (progress.getTimesSeen() >= 1) {
            return CardLearningStatus.LEARNING;
        } else {
            return CardLearningStatus.NEW;
        }
    }

    private DeckCardResponse toDeckCardResponse(UserCardProgress progress, Card card) {
        // FIXME maybe need to more clearly define the types of progressInfo fields
        DeckCardResponse.CardProgressInfo progressInfo = new DeckCardResponse.CardProgressInfo(
            progress.getStatus(),
            progress.getTimesSeen(),
            progress.getTimesCorrect(),
            progress.getTimesWrong(),
            progress.getCorrectStreak()
        );

        return new DeckCardResponse(
            card.getId(),
            card.getTitle(),
            card.getDefinition(),
            card.getSynonyms(),
            card.getExamples(),
            card.getTranslation(),
            progressInfo
        );
    }
}
