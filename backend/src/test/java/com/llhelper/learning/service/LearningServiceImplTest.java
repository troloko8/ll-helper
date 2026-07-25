package com.llhelper.learning.service;

import static com.llhelper.learning.support.LearningTestData.defaultCardProgress;
import static com.llhelper.learning.support.LearningTestData.defaultDeckProgress;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.llhelper.card.entity.Card;
import com.llhelper.card.repository.CardRepository;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.common.support.TestData;
import com.llhelper.deck.entity.Deck;
import com.llhelper.deck.repository.DeckRepository;
import com.llhelper.learning.dto.request.CardReviewRequest;
import com.llhelper.learning.dto.response.EnrollResponse;
import com.llhelper.learning.entity.UserCardProgress;
import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.CardLearningStatus;
import com.llhelper.learning.mapper.LearningMapper;
import com.llhelper.learning.repository.UserCardProgressRepository;
import com.llhelper.learning.repository.UserDeckProgressRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class LearningServiceImplTest {

    private static final Long USER_ID = 1L;
    private static final Long DECK_ID = 2L;
    private static final Long CARD_ID = 3L;
    private static final Long USER_DECK_PROGRESS_ID = 10L;

    @Mock
    private UserDeckProgressRepository userDeckProgressRepository;

    @Mock
    private UserCardProgressRepository userCardProgressRepository;

    @Mock
    private DeckRepository deckRepository;

    @Mock
    private CardRepository cardRepository;

    @Mock
    private SecurityUtils securityUtils;

    @Mock
    private LearningMapper learningMapper;

    private final Clock clock = TestData.fixedClock();

    private LearningServiceImpl learningService;

    @BeforeEach
    void setUp() {
        learningService = new LearningServiceImpl(
            userDeckProgressRepository,
            userCardProgressRepository,
            deckRepository,
            cardRepository,
            securityUtils,
            learningMapper,
            clock
        );
    }

    private static Card card(String title) {
        Card card = new Card();
        card.setId(CARD_ID);
        card.setTitle(title);
        card.setDeckId(DECK_ID);
        return card;
    }

    private static Deck publicDeck(Card... cards) {
        Deck deck = new Deck();
        deck.setId(DECK_ID);
        deck.setIsPublic(true);
        deck.setCards(List.of(cards));
        return deck;
    }

    private static UserDeckProgress deckProgressWithId() {
        UserDeckProgress deckProgress = defaultDeckProgress();
        deckProgress.setId(USER_DECK_PROGRESS_ID);
        return deckProgress;
    }

    /**
     * Stubs the "user is enrolled and has progress for this card" happy path,
     * shared by most reviewCard() scenarios.
     */
    private void mockExistingProgress(Card card, UserDeckProgress deckProgress, UserCardProgress cardProgress) {
        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(cardRepository.findById(CARD_ID)).thenReturn(Optional.of(card));
        when(userDeckProgressRepository.findByUserIdAndDeckId(USER_ID, DECK_ID)).thenReturn(Optional.of(deckProgress));
        when(userCardProgressRepository.findByUserDeckProgressIdAndCardId(USER_DECK_PROGRESS_ID, CARD_ID))
            .thenReturn(Optional.of(cardProgress));
    }

    // --- enrollDeck ---

    @Test
    void enroll_shouldCreateProgress_whenNotEnrolled() {
        Deck deck = publicDeck(card("hello"));
        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(deckRepository.findById(DECK_ID)).thenReturn(Optional.of(deck));

        UserDeckProgress deckProgress = deckProgressWithId();
        when(learningMapper.toUserDeckProgress(USER_ID, DECK_ID)).thenReturn(deckProgress);
        when(userDeckProgressRepository.save(deckProgress)).thenReturn(deckProgress);

        UserCardProgress cardProgress = defaultCardProgress();
        when(learningMapper.toUserCardProgress(USER_ID, CARD_ID, USER_DECK_PROGRESS_ID)).thenReturn(cardProgress);

        EnrollResponse response = learningService.enrollDeck(DECK_ID);

        assertThat(response.userDeckId()).isEqualTo(USER_DECK_PROGRESS_ID);
        verify(learningMapper).toUserDeckProgress(USER_ID, DECK_ID);
        verify(learningMapper).toUserCardProgress(USER_ID, CARD_ID, USER_DECK_PROGRESS_ID);
        verify(userDeckProgressRepository).save(deckProgress);
        verify(userCardProgressRepository).saveAll(List.of(cardProgress));
    }

    @Test
    void enroll_shouldThrowConflict_whenAlreadyEnrolled() {
        Deck deck = publicDeck(card("hello"));
        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(deckRepository.findById(DECK_ID)).thenReturn(Optional.of(deck));

        UserDeckProgress deckProgress = defaultDeckProgress();
        when(learningMapper.toUserDeckProgress(USER_ID, DECK_ID)).thenReturn(deckProgress);
        when(userDeckProgressRepository.save(deckProgress)).thenThrow(
            new DataIntegrityViolationException(
                "duplicate key value violates unique constraint \"uk_user_deck_progress_user_deck\""
            )
        );

        assertThatThrownBy(() -> learningService.enrollDeck(DECK_ID))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("already enrolled");

        verify(userCardProgressRepository, never()).saveAll(any());
    }

    @Test
    void enroll_shouldThrowNotFound_whenDeckDoesNotExist() {
        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(deckRepository.findById(DECK_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> learningService.enrollDeck(DECK_ID))
            .isInstanceOf(EntityNotFoundException.class)
            .hasMessageContaining("Deck");

        verify(userDeckProgressRepository, never()).save(any());
        verify(userCardProgressRepository, never()).saveAll(any());
    }

    // --- reviewCard ---

    @Test
    void review_shouldIncrementCorrect_whenResultIsCorrect() {
        Card card = card("hello");
        UserDeckProgress deckProgress = deckProgressWithId();
        UserCardProgress cardProgress = defaultCardProgress();
        mockExistingProgress(card, deckProgress, cardProgress);

        learningService.reviewCard(CARD_ID, new CardReviewRequest("hello"));

        assertThat(cardProgress.getTimesCorrect()).isEqualTo(1);
        assertThat(cardProgress.getCorrectStreak()).isEqualTo(1);
        assertThat(cardProgress.getTimesSeen()).isEqualTo(1);
        assertThat(cardProgress.getLastReviewedAt()).isEqualTo(clock.instant());
        verify(userCardProgressRepository).save(cardProgress);
        verify(userDeckProgressRepository).save(deckProgress);
    }

    @Test
    void review_shouldResetStreak_whenResultIsWrong() {
        Card card = card("hello");
        UserDeckProgress deckProgress = deckProgressWithId();
        UserCardProgress cardProgress = defaultCardProgress();
        cardProgress.setTimesCorrect(1);
        cardProgress.setCorrectStreak(2);
        mockExistingProgress(card, deckProgress, cardProgress);

        learningService.reviewCard(CARD_ID, new CardReviewRequest("wrong answer"));

        assertThat(cardProgress.getTimesWrong()).isEqualTo(1);
        assertThat(cardProgress.getCorrectStreak()).isEqualTo(0);
        verify(userCardProgressRepository).save(cardProgress);
    }

    @Test
    void review_shouldMarkCorrect_whenAnswerDiffersByCaseAndWhitespace() {
        Card card = card("Hello");
        UserDeckProgress deckProgress = deckProgressWithId();
        UserCardProgress cardProgress = defaultCardProgress();
        mockExistingProgress(card, deckProgress, cardProgress);

        learningService.reviewCard(CARD_ID, new CardReviewRequest("  hello  "));

        assertThat(cardProgress.getTimesCorrect()).isEqualTo(1);
        assertThat(cardProgress.getTimesWrong()).isEqualTo(0);
    }

    // NOTE: review_shouldCalculateNextReview_basedOnDifficulty() is intentionally skipped —
    // nextReviewAt calculation is not implemented in LearningServiceImpl yet.

    @Test
    void review_shouldThrowNotFound_whenProgressDoesNotExist() {
        Card card = card("hello");
        UserDeckProgress deckProgress = deckProgressWithId();

        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(cardRepository.findById(CARD_ID)).thenReturn(Optional.of(card));
        when(userDeckProgressRepository.findByUserIdAndDeckId(USER_ID, DECK_ID)).thenReturn(Optional.of(deckProgress));
        when(userCardProgressRepository.findByUserDeckProgressIdAndCardId(USER_DECK_PROGRESS_ID, CARD_ID))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> learningService.reviewCard(CARD_ID, new CardReviewRequest("hello")))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Card progress not found");

        verify(userCardProgressRepository, never()).save(any());
        verify(userDeckProgressRepository, never()).save(any());
    }

    @Test
    void review_shouldTransitionToLearning_whenNewCardReviewed() {
        Card card = card("hello");
        UserDeckProgress deckProgress = deckProgressWithId();
        UserCardProgress cardProgress = defaultCardProgress();
        mockExistingProgress(card, deckProgress, cardProgress);

        learningService.reviewCard(CARD_ID, new CardReviewRequest("hello"));

        assertThat(cardProgress.getStatus()).isEqualTo(CardLearningStatus.LEARNING);
    }

    @Test
    void review_shouldNotTransitionToMastered_whenThresholdNotReached() {
        Card card = card("hello");
        UserDeckProgress deckProgress = deckProgressWithId();
        UserCardProgress cardProgress = defaultCardProgress();
        cardProgress.setTimesSeen(1);
        cardProgress.setTimesCorrect(1);
        cardProgress.setCorrectStreak(1);
        cardProgress.setStatus(CardLearningStatus.LEARNING);
        mockExistingProgress(card, deckProgress, cardProgress);

        learningService.reviewCard(CARD_ID, new CardReviewRequest("hello"));

        assertThat(cardProgress.getCorrectStreak()).isEqualTo(2);
        assertThat(cardProgress.getStatus()).isEqualTo(CardLearningStatus.REVIEWING);
    }

    @Test
    void review_shouldTransitionToMastered_whenThresholdReached() {
        Card card = card("hello");
        UserDeckProgress deckProgress = deckProgressWithId();
        UserCardProgress cardProgress = defaultCardProgress();
        cardProgress.setTimesSeen(2);
        cardProgress.setTimesCorrect(2);
        cardProgress.setCorrectStreak(2);
        cardProgress.setStatus(CardLearningStatus.REVIEWING);
        mockExistingProgress(card, deckProgress, cardProgress);

        learningService.reviewCard(CARD_ID, new CardReviewRequest("hello"));

        assertThat(cardProgress.getStatus()).isEqualTo(CardLearningStatus.MASTERED);
    }

    @Test
    void review_shouldDowngradeToReviewing_whenMasteredCardAnsweredWrong() {
        Card card = card("hello");
        UserDeckProgress deckProgress = deckProgressWithId();
        UserCardProgress cardProgress = defaultCardProgress();
        cardProgress.setTimesSeen(3);
        cardProgress.setTimesCorrect(3);
        cardProgress.setCorrectStreak(3);
        cardProgress.setStatus(CardLearningStatus.MASTERED);
        mockExistingProgress(card, deckProgress, cardProgress);

        learningService.reviewCard(CARD_ID, new CardReviewRequest("wrong answer"));

        assertThat(cardProgress.getCorrectStreak()).isEqualTo(0);
        assertThat(cardProgress.getStatus()).isEqualTo(CardLearningStatus.REVIEWING);
    }
}
