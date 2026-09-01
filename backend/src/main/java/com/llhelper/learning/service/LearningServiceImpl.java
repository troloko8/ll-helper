package com.llhelper.learning.service;

import com.llhelper.card.entity.Card;
import com.llhelper.card.repository.CardRepository;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.deck.entity.Deck;
import com.llhelper.deck.repository.DeckRepository;
import com.llhelper.learning.dto.request.CardReviewRequest;
import com.llhelper.learning.dto.response.CardReviewResponse;
import com.llhelper.learning.dto.response.DeckCardResponse;
import com.llhelper.learning.dto.response.EnrollResponse;
import com.llhelper.learning.dto.response.LearningDeckResponse;
import com.llhelper.learning.entity.UserCardProgress;
import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.CardLearningStatus;
import com.llhelper.learning.enums.UserDeckStatus;
import com.llhelper.learning.mapper.LearningMapper;
import com.llhelper.learning.repository.UserCardProgressRepository;
import com.llhelper.learning.repository.UserDeckProgressRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
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
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<LearningDeckResponse> getMyDecks() {
        Long userId = securityUtils.getCurrentUserId();
        List<UserDeckProgress> myProgress = userDeckProgressRepository
            .findAllByUserIdAndStatus(userId, UserDeckStatus.ACTIVE);

        if (myProgress.isEmpty()) {
            return List.of();
        }

        List<Long> deckIds = myProgress.stream()
            .map(UserDeckProgress::getDeckId)
            .collect(Collectors.toList());

        Map<Long, Deck> deckMap = deckRepository.findAllById(deckIds).stream()
            .collect(Collectors.toMap(Deck::getId, d -> d));

        List<Long> deckProgressIds = myProgress.stream()
            .map(UserDeckProgress::getId)
            .toList();

        Map<Long, List<UserCardProgress>> cardProgressByDeckProgressId = userCardProgressRepository
            .findAllByUserDeckProgressIdIn(deckProgressIds)
            .stream()
            .collect(Collectors.groupingBy(UserCardProgress::getUserDeckProgressId));

        return myProgress.stream()
            .sorted(LearningServiceImpl::compareLearningDecks)
            .map(p -> {
                Deck deck = requireDeck(deckMap, p.getDeckId());
                List<UserCardProgress> cardProgress = cardProgressByDeckProgressId
                    .getOrDefault(p.getId(), List.of());
                long total = cardProgress.size();
                long mastered = cardProgress.stream()
                    .filter(cp -> cp.getStatus() == CardLearningStatus.MASTERED)
                    .count();
                return learningMapper.toLearningDeckResponse(
                    p, deck, new LearningDeckResponse.ProgressSummary(mastered, total));
            })
            .collect(Collectors.toList());
    }

    private static int compareLearningDecks(UserDeckProgress left, UserDeckProgress right) {
        boolean leftStudied = left.getLastStudiedAt() != null;
        boolean rightStudied = right.getLastStudiedAt() != null;

        if (leftStudied != rightStudied) {
            return leftStudied ? -1 : 1;
        }

        int activityComparison = leftStudied
            ? right.getLastStudiedAt().compareTo(left.getLastStudiedAt())
            : right.getEnrolledAt().compareTo(left.getEnrolledAt());

        if (activityComparison != 0) {
            return activityComparison;
        }

        return Comparator.nullsLast(Long::compareTo).compare(left.getId(), right.getId());
    }

    private static Deck requireDeck(Map<Long, Deck> deckMap, Long deckId) {
        Deck deck = deckMap.get(deckId);
        if (deck == null) {
            throw new EntityNotFoundException("Deck not found: " + deckId);
        }
        return deck;
    }

    @Override
    @Transactional
    public EnrollResponse enrollDeck(Long deckId) {
        Long userId = securityUtils.getCurrentUserId();

        Deck deck = deckRepository.findById(deckId)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + deckId));

        if (!Boolean.TRUE.equals(deck.getIsPublic())) {
            throw new AccessDeniedException("Access denied: Deck is not public");
        }

        try {
            UserDeckProgress progress = learningMapper.toUserDeckProgress(userId, deckId, Instant.now(clock));
            UserDeckProgress savedProgress = userDeckProgressRepository.save(progress);

            // Create UserCardProgress for all cards in the deck with NEW status
            List<UserCardProgress> cardProgressList = deck.getCards().stream()
                .map(card -> learningMapper.toUserCardProgress(userId, card.getId(), savedProgress.getId()))
                .collect(Collectors.toList());

            userCardProgressRepository.saveAll(cardProgressList);

            return new EnrollResponse(savedProgress.getId());
        } catch (DataIntegrityViolationException e) {
            // FIXME: matching on exception message text is fragile — it depends on PostgreSQL
            // version, JDBC driver, and locale. Consider a pre-check (existsByUserIdAndDeckId)
            // or a dedicated exception-translation layer instead.
            // Check if this is specifically the duplicate enrollment constraint
            String message = e.getMessage();
            if (message != null && message.contains("uk_user_deck_progress_user_deck")) {
                throw new IllegalStateException("Deck already enrolled");
            }
            // Other data integrity violations are propagated and mapped to 409 Conflict
            // by GlobalExceptionHandler.
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckCardResponse> getStudyCards(Long deckId) {
        DeckCardsData data = loadDeckCardsWithProgress(deckId);

        return data.allCardProgress().stream()
            .filter(progress -> progress.getStatus() != CardLearningStatus.MASTERED)
            .sorted(Comparator
                .comparingInt((UserCardProgress progress) -> studyPriority(progress.getStatus()))
                .thenComparing(UserCardProgress::getCardId))
            .limit(10)
            .map(progress -> toDeckCardResponse(data.cardMap().get(progress.getCardId()), progress))
            .toList();
    }

    private static int studyPriority(CardLearningStatus status) {
        return switch (status) {
            case LEARNING -> 0;
            case REVIEWING -> 1;
            case NEW -> 2;
            case MASTERED -> 3;
        };
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
            .orElseThrow(() -> new EntityNotFoundException("Card progress not found: " + cardId));

        boolean isCorrect = request.userAnswer().trim().equalsIgnoreCase(card.getTitle().trim());

        cardProgress.setTimesSeen(cardProgress.getTimesSeen() + 1);
        cardProgress.setLastReviewedAt(Instant.now(clock));

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

        deckProgress.setLastStudiedAt(Instant.now(clock));
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
