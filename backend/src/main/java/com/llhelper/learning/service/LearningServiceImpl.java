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
import com.llhelper.learning.dto.response.LearningDeckDetailsResponse;
import com.llhelper.learning.dto.response.LearningDeckResponse;
import com.llhelper.learning.dto.response.StudySessionResponse;
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
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
        return userDeckProgressRepository.findLearningDeckSummaries(userId).stream()
            .map(summary -> learningMapper.toLearningDeckResponse(
                summary,
                new LearningDeckResponse.ProgressSummary(
                    summary.getMasteredCount(),
                    summary.getTotalCount()
                )
            ))
            .toList();
    }

    @Override
    @Transactional
    public EnrollResponse enrollDeck(Long deckId) {
        Long userId = securityUtils.getCurrentUserId();

        Deck deck = deckRepository.findById(deckId)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + deckId));

        if (!Boolean.TRUE.equals(deck.getIsPublic())
                && !Objects.equals(deck.getOwner().getId(), userId)) {
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
    public StudySessionResponse getStudySession(Long deckId) {
        Long userId = securityUtils.getCurrentUserId();
        UserDeckProgress deckProgress = requireEnrollment(userId, deckId);
        List<UserCardProgress> studyQueue = userCardProgressRepository.findStudyQueue(deckProgress.getId());
        DeckCardsData data = loadCardsWithProgress(studyQueue);
        Deck deck = deckRepository.findById(deckId)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + deckId));

        List<DeckCardResponse> cards = toDeckCardResponses(data);
        return new StudySessionResponse(deck.getId(), deck.getTitle(), cards);
    }

    @Override
    @Transactional(readOnly = true)
    public LearningDeckDetailsResponse getLearningDeck(Long deckId) {
        Long userId = securityUtils.getCurrentUserId();
        UserDeckProgress deckProgress = userDeckProgressRepository
            .findByUserIdAndDeckIdAndStatus(userId, deckId, UserDeckStatus.ACTIVE)
            .orElseThrow(() -> new IllegalStateException("Deck not enrolled. Please enroll first."));
        Deck deck = deckRepository.findById(deckId)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + deckId));
        DeckCardsData data = loadDeckCardsWithProgress(deckProgress);
        List<DeckCardResponse> cards = toDeckCardResponses(data);
        long masteredCount = data.allCardProgress().stream()
            .filter(progress -> progress.getStatus() == CardLearningStatus.MASTERED)
            .count();
        LearningDeckResponse.ProgressSummary progress = new LearningDeckResponse.ProgressSummary(
            masteredCount,
            data.allCardProgress().size()
        );

        return learningMapper.toLearningDeckDetailsResponse(deckProgress, deck, progress, cards);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckCardResponse> getDeckCards(Long deckId) {
        DeckCardsData data = loadDeckCardsWithProgress(deckId);

        return toDeckCardResponses(data);
    }

    @Override
    @Transactional
    public CardReviewResponse reviewCard(Long cardId, CardReviewRequest request) {
        // TODO: Read User.id from a JWT claim after the token migration tracked in
        // backend/IMPROVEMENTS.md, instead of accepting identity from the client.
        Long userId = securityUtils.getCurrentUserId();

        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new EntityNotFoundException("Card not found: " + cardId));

        UserDeckProgress deckProgress = userDeckProgressRepository.findByUserIdAndDeckId(userId, card.getDeckId())
            .orElseThrow(() -> new IllegalStateException("Deck not enrolled. Please enroll first."));

        UserCardProgress cardProgress = userCardProgressRepository.findByUserDeckProgressIdAndCardId(deckProgress.getId(), cardId)
            .orElseThrow(() -> new EntityNotFoundException("Card progress not found: " + cardId));

        boolean isCorrect = request.userAnswer().trim().equalsIgnoreCase(card.getTitle().trim());
        Instant reviewedAt = Instant.now(clock);

        cardProgress.setTimesSeen(cardProgress.getTimesSeen() + 1);
        cardProgress.setLastReviewedAt(reviewedAt);

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

        deckProgress.setLastStudiedAt(reviewedAt);
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
        return loadDeckCardsWithProgress(requireEnrollment(userId, deckId));
    }

    private DeckCardsData loadDeckCardsWithProgress(UserDeckProgress deckProgress) {
        List<UserCardProgress> allCardProgress = userCardProgressRepository.findAllByUserDeckProgressId(deckProgress.getId());
        return loadCardsWithProgress(allCardProgress);
    }

    private DeckCardsData loadCardsWithProgress(List<UserCardProgress> allCardProgress) {
        List<Long> cardIds = allCardProgress.stream()
            .map(UserCardProgress::getCardId)
            .collect(Collectors.toList());

        Map<Long, Card> cardMap = cardRepository.findAllById(cardIds).stream()
            .collect(Collectors.toMap(Card::getId, card -> card));

        return new DeckCardsData(allCardProgress, cardMap);
    }

    private UserDeckProgress requireEnrollment(Long userId, Long deckId) {
        return userDeckProgressRepository.findByUserIdAndDeckId(userId, deckId)
            .orElseThrow(() -> new IllegalStateException("Deck not enrolled. Please enroll first."));
    }

    private List<DeckCardResponse> toDeckCardResponses(DeckCardsData data) {
        return data.allCardProgress().stream()
            .map(progress -> learningMapper.toDeckCardResponse(
                data.cardMap().get(progress.getCardId()),
                progress
            ))
            .toList();
    }

    private record DeckCardsData(List<UserCardProgress> allCardProgress, Map<Long, Card> cardMap) {}
}
