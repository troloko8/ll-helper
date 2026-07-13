package com.llhelper.learning.service;

import com.llhelper.card.entity.Card;
import com.llhelper.card.repository.CardRepository;
import com.llhelper.deck.entity.Deck;
import com.llhelper.deck.repository.DeckRepository;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.learning.dto.request.CardReviewRequest;
import com.llhelper.learning.dto.response.CardReviewResponse;
import com.llhelper.learning.dto.response.DeckCardResponse;
import com.llhelper.learning.dto.response.EnrollResponse;
import com.llhelper.learning.entity.UserCardProgress;
import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.CardLearningStatus;
import com.llhelper.learning.mapper.LearningMapper;
import com.llhelper.learning.repository.UserCardProgressRepository;
import com.llhelper.learning.repository.UserDeckProgressRepository;
import java.time.Instant;
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
    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final SecurityUtils securityUtils;
    private final LearningMapper learningMapper;

    @Override
    @Transactional
    public EnrollResponse enrollDeck(Long deckId) {
        Long userId = securityUtils.getCurrentUserId();

        if (userDeckProgressRepository.existsByUserIdAndDeckId(userId, deckId)) {
            throw new IllegalStateException("Deck already enrolled");
        }

        Deck deck = deckRepository.findById(deckId)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + deckId));

        if (!Boolean.TRUE.equals(deck.getIsPublic())) {
            throw new AccessDeniedException("Access denied: Deck is not public");
        }

        UserDeckProgress progress = learningMapper.toUserDeckProgress(userId, deckId);
        UserDeckProgress savedProgress = userDeckProgressRepository.save(progress);

        // Create UserCardProgress for all cards in the deck with NEW status
        List<UserCardProgress> cardProgressList = deck.getCards().stream()
            .map(card -> learningMapper.toUserCardProgress(userId, card.getId(), savedProgress.getId()))
            .collect(Collectors.toList());

        userCardProgressRepository.saveAll(cardProgressList);

        return new EnrollResponse(savedProgress.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckCardResponse> getStudyCards(Long deckId) {
        DeckCardsData data = loadDeckCardsWithProgress(deckId);

        // Priority 1: LEARNING cards
        List<UserCardProgress> learningCards = data.allCardProgress().stream()
            .filter(p -> p.getStatus() == CardLearningStatus.LEARNING)
            .sorted(Comparator.comparing(UserCardProgress::getCardId))
            .limit(10)
            .collect(Collectors.toList());

        // Priority 2: NEW cards (if less than 10 learning cards)
        if (learningCards.size() < 10) {
            int remaining = 10 - learningCards.size();

            List<UserCardProgress> newCards = data.allCardProgress().stream()
                .filter(p -> p.getStatus() == CardLearningStatus.NEW)
                .sorted(Comparator.comparing(UserCardProgress::getCardId))
                .limit(remaining)
                .toList();

            learningCards.addAll(newCards);
        }

        return learningCards.stream()
            .map(p -> toDeckCardResponse(data.cardMap().get(p.getCardId()), p))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckCardResponse> getDeckCards(Long deckId) {
        DeckCardsData data = loadDeckCardsWithProgress(deckId);

        return data.allCardProgress().stream()
            .map(p -> toDeckCardResponse(data.cardMap().get(p.getCardId()), p))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CardReviewResponse reviewCard(Long cardId, CardReviewRequest request) {
        // FIXME: maybe better to send userId from controller hence from frontend
        Long userId = securityUtils.getCurrentUserId();

        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new EntityNotFoundException("Card not found: " + cardId));

        UserDeckProgress deckProgress = userDeckProgressRepository.findByUserIdAndDeckId(userId, card.getDeckId())
            .orElseThrow(() -> new IllegalStateException("Deck not enrolled. Please enroll first."));

        UserCardProgress cardProgress = userCardProgressRepository.findByUserDeckProgressIdAndCardId(deckProgress.getId(), cardId)
            .orElseThrow(() -> new IllegalStateException("Card progress not found. Please enroll first."));

        boolean isCorrect = request.userAnswer().trim().equalsIgnoreCase(card.getTitle().trim());

        cardProgress.setTimesSeen(cardProgress.getTimesSeen() + 1);
        cardProgress.setLastReviewedAt(Instant.now());

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

        deckProgress.setLastStudiedAt(Instant.now());
        userDeckProgressRepository.save(deckProgress);

        return learningMapper.toCardReviewResponse(isCorrect, card, newStatus, cardProgress);
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

    private DeckCardsData loadDeckCardsWithProgress(Long deckId) {
        Long userId = securityUtils.getCurrentUserId();

        UserDeckProgress deckProgress = userDeckProgressRepository.findByUserIdAndDeckId(userId, deckId)
            .orElseThrow(() -> new IllegalStateException("Deck not enrolled. Please enroll first."));

        List<UserCardProgress> allCardProgress = userCardProgressRepository.findAllByUserDeckProgressId(deckProgress.getId());

        List<Long> cardIds = allCardProgress.stream()
            .map(UserCardProgress::getCardId)
            .collect(Collectors.toList());

        Map<Long, Card> cardMap = cardRepository.findAllById(cardIds).stream()
            .collect(Collectors.toMap(Card::getId, card -> card));

        return new DeckCardsData(allCardProgress, cardMap);
    }

    private DeckCardResponse toDeckCardResponse(Card card, UserCardProgress progress) {
        return learningMapper.toDeckCardResponse(card, progress);
    }

    private record DeckCardsData(List<UserCardProgress> allCardProgress, Map<Long, Card> cardMap) {}
}
