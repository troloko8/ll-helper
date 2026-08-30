package com.llhelper.learning.service;

import static com.llhelper.learning.support.LearningTestData.defaultCardProgress;
import static com.llhelper.learning.support.LearningTestData.defaultDeckProgress;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.llhelper.card.entity.Card;
import com.llhelper.card.repository.CardRepository;
import com.llhelper.common.model.Language;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.common.support.TestData;
import com.llhelper.deck.entity.Deck;
import com.llhelper.deck.repository.DeckRepository;
import com.llhelper.learning.dto.request.CardReviewRequest;
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
        deckProgress.setDeckId(DECK_ID);
        return deckProgress;
    }

    private static UserDeckProgress deckProgress(
        long progressId,
        long deckId,
        Instant enrolledAt,
        Instant lastStudiedAt
    ) {
        UserDeckProgress progress = defaultDeckProgress();
        progress.setId(progressId);
        progress.setDeckId(deckId);
        progress.setEnrolledAt(enrolledAt);
        progress.setLastStudiedAt(lastStudiedAt);
        return progress;
    }

    private static Deck deck(long deckId, String title) {
        Deck deck = publicDeck(new Card[0]);
        deck.setId(deckId);
        deck.setTitle(title);
        deck.setSourceLanguage(Language.EN);
        deck.setTargetLanguage(Language.RU);
        return deck;
    }

    private static UserCardProgress cardProgress(long deckProgressId, CardLearningStatus status) {
        UserCardProgress progress = defaultCardProgress();
        progress.setUserDeckProgressId(deckProgressId);
        progress.setStatus(status);
        return progress;
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
        when(learningMapper.toUserDeckProgress(USER_ID, DECK_ID, clock.instant())).thenReturn(deckProgress);
        when(userDeckProgressRepository.save(deckProgress)).thenReturn(deckProgress);

        UserCardProgress cardProgress = defaultCardProgress();
        when(learningMapper.toUserCardProgress(USER_ID, CARD_ID, USER_DECK_PROGRESS_ID)).thenReturn(cardProgress);

        EnrollResponse response = learningService.enrollDeck(DECK_ID);

        assertThat(response.userDeckId()).isEqualTo(USER_DECK_PROGRESS_ID);
        verify(learningMapper).toUserDeckProgress(USER_ID, DECK_ID, clock.instant());
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
        when(learningMapper.toUserDeckProgress(eq(USER_ID), eq(DECK_ID), any(Instant.class))).thenReturn(deckProgress);
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

    // --- getMyDecks ---

    @Test
    void getMyDecks_shouldReturnOnlyActiveDecksWithAggregatedProgress_usingBatchQueries() {
        UserDeckProgress firstProgress = deckProgress(
            USER_DECK_PROGRESS_ID,
            DECK_ID,
            Instant.parse("2024-01-01T10:00:00Z"),
            Instant.parse("2024-01-03T10:00:00Z")
        );
        UserDeckProgress secondProgress = deckProgress(
            11L,
            4L,
            Instant.parse("2024-01-02T10:00:00Z"),
            null
        );
        Deck firstDeck = deck(DECK_ID, "First Deck");
        Deck secondDeck = deck(4L, "Second Deck");
        List<UserCardProgress> allCardProgress = List.of(
            cardProgress(USER_DECK_PROGRESS_ID, CardLearningStatus.MASTERED),
            cardProgress(USER_DECK_PROGRESS_ID, CardLearningStatus.LEARNING),
            cardProgress(11L, CardLearningStatus.NEW)
        );

        LearningDeckResponse firstResponse = new LearningDeckResponse(
            DECK_ID,
            "First Deck",
            Language.EN,
            Language.RU,
            firstProgress.getEnrolledAt(),
            firstProgress.getLastStudiedAt(),
            new LearningDeckResponse.ProgressSummary(1, 2)
        );
        LearningDeckResponse secondResponse = new LearningDeckResponse(
            4L,
            "Second Deck",
            Language.EN,
            Language.RU,
            secondProgress.getEnrolledAt(),
            null,
            new LearningDeckResponse.ProgressSummary(0, 1)
        );

        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(userDeckProgressRepository.findAllByUserIdAndStatus(USER_ID, UserDeckStatus.ACTIVE))
            .thenReturn(List.of(secondProgress, firstProgress));
        when(deckRepository.findAllById(List.of(4L, DECK_ID))).thenReturn(List.of(firstDeck, secondDeck));
        when(userCardProgressRepository.findAllByUserDeckProgressIdIn(List.of(11L, USER_DECK_PROGRESS_ID)))
            .thenReturn(allCardProgress);
        when(learningMapper.toLearningDeckResponse(
            firstProgress,
            firstDeck,
            new LearningDeckResponse.ProgressSummary(1, 2)
        )).thenReturn(firstResponse);
        when(learningMapper.toLearningDeckResponse(
            secondProgress,
            secondDeck,
            new LearningDeckResponse.ProgressSummary(0, 1)
        )).thenReturn(secondResponse);

        List<LearningDeckResponse> result = learningService.getMyDecks();

        assertThat(result).containsExactly(firstResponse, secondResponse);
        verify(userDeckProgressRepository).findAllByUserIdAndStatus(USER_ID, UserDeckStatus.ACTIVE);
        verify(deckRepository).findAllById(List.of(4L, DECK_ID));
        verify(userCardProgressRepository).findAllByUserDeckProgressIdIn(List.of(11L, USER_DECK_PROGRESS_ID));
        verify(userCardProgressRepository, never()).findAllByUserDeckProgressId(any());
    }

    @Test
    void getMyDecks_shouldSortStudiedByLastStudiedAndUnstudiedByEnrollment() {
        UserDeckProgress unstudiedOlder = deckProgress(
            40L, 40L, Instant.parse("2024-01-01T10:00:00Z"), null);
        UserDeckProgress studiedOlder = deckProgress(
            20L, 20L, Instant.parse("2024-01-04T10:00:00Z"), Instant.parse("2024-01-02T10:00:00Z"));
        UserDeckProgress unstudiedNewer = deckProgress(
            30L, 30L, Instant.parse("2024-01-03T10:00:00Z"), null);
        UserDeckProgress studiedNewer = deckProgress(
            10L, 10L, Instant.parse("2024-01-01T10:00:00Z"), Instant.parse("2024-01-04T10:00:00Z"));
        UserDeckProgress studiedNewerTie = deckProgress(
            15L, 15L, Instant.parse("2024-01-02T10:00:00Z"), Instant.parse("2024-01-04T10:00:00Z"));
        UserDeckProgress unstudiedNewerTie = deckProgress(
            35L, 35L, Instant.parse("2024-01-03T10:00:00Z"), null);
        List<UserDeckProgress> progress = List.of(
            unstudiedOlder, studiedOlder, unstudiedNewerTie, studiedNewerTie, unstudiedNewer, studiedNewer);
        List<Deck> decks = List.of(
            deck(10L, "10"), deck(15L, "15"), deck(20L, "20"),
            deck(30L, "30"), deck(35L, "35"), deck(40L, "40"));

        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(userDeckProgressRepository.findAllByUserIdAndStatus(USER_ID, UserDeckStatus.ACTIVE))
            .thenReturn(progress);
        when(deckRepository.findAllById(List.of(40L, 20L, 35L, 15L, 30L, 10L))).thenReturn(decks);
        when(userCardProgressRepository.findAllByUserDeckProgressIdIn(List.of(40L, 20L, 35L, 15L, 30L, 10L)))
            .thenReturn(List.of());
        when(learningMapper.toLearningDeckResponse(
            any(UserDeckProgress.class),
            any(Deck.class),
            eq(new LearningDeckResponse.ProgressSummary(0, 0))
        )).thenAnswer(invocation -> {
            UserDeckProgress deckProgress = invocation.getArgument(0);
            Deck mappedDeck = invocation.getArgument(1);
            return new LearningDeckResponse(
                deckProgress.getDeckId(),
                mappedDeck.getTitle(),
                mappedDeck.getSourceLanguage(),
                mappedDeck.getTargetLanguage(),
                deckProgress.getEnrolledAt(),
                deckProgress.getLastStudiedAt(),
                new LearningDeckResponse.ProgressSummary(0, 0)
            );
        });

        List<LearningDeckResponse> result = learningService.getMyDecks();

        assertThat(result).extracting(LearningDeckResponse::deckId)
            .containsExactly(10L, 15L, 20L, 30L, 35L, 40L);
    }

    @Test
    void getMyDecks_shouldReturnEmptyList_withoutLoadingDecksOrCards() {
        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(userDeckProgressRepository.findAllByUserIdAndStatus(USER_ID, UserDeckStatus.ACTIVE))
            .thenReturn(List.of());

        List<LearningDeckResponse> result = learningService.getMyDecks();

        assertThat(result).isEmpty();
        verifyNoInteractions(deckRepository, userCardProgressRepository);
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
            .isInstanceOf(EntityNotFoundException.class)
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
