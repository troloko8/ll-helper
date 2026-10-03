package com.llhelper.learning.service;

import static com.llhelper.learning.support.LearningTestData.defaultCardProgress;
import static com.llhelper.learning.support.LearningTestData.defaultDeckProgress;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
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
import com.llhelper.learning.repository.UserDeckProgressRepository.LearningDeckSummaryProjection;
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
        return card(CARD_ID, title);
    }

    private static Card card(long cardId, String title) {
        Card card = new Card();
        card.setId(cardId);
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

    private static Deck deck(long deckId, String title) {
        Deck deck = publicDeck();
        deck.setId(deckId);
        deck.setTitle(title);
        deck.setSourceLanguage(Language.EN);
        deck.setTargetLanguage(Language.RU);
        return deck;
    }

    private static UserCardProgress cardProgress(long deckProgressId, CardLearningStatus status) {
        return cardProgress(deckProgressId, CARD_ID, status);
    }

    private static UserCardProgress cardProgress(
        long deckProgressId,
        long cardId,
        CardLearningStatus status
    ) {
        UserCardProgress progress = defaultCardProgress();
        progress.setUserDeckProgressId(deckProgressId);
        progress.setCardId(cardId);
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
    void getMyDecks_shouldMapAggregatedRepositoryRows() {
        LearningDeckSummaryProjection summary = mock(LearningDeckSummaryProjection.class);
        LearningDeckResponse response = new LearningDeckResponse(
            DECK_ID, "First Deck", Language.EN, Language.RU,
            Instant.parse("2024-01-01T10:00:00Z"),
            Instant.parse("2024-01-03T10:00:00Z"),
            new LearningDeckResponse.ProgressSummary(1, 2)
        );
        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(userDeckProgressRepository.findLearningDeckSummaries(USER_ID)).thenReturn(List.of(summary));
        LearningDeckResponse.ProgressSummary progress = new LearningDeckResponse.ProgressSummary(1, 2);
        when(summary.getMasteredCount()).thenReturn(1L);
        when(summary.getTotalCount()).thenReturn(2L);
        when(learningMapper.toLearningDeckResponse(summary, progress)).thenReturn(response);

        assertThat(learningService.getMyDecks()).containsExactly(response);
        verify(userDeckProgressRepository).findLearningDeckSummaries(USER_ID);
        verifyNoInteractions(deckRepository, userCardProgressRepository);
    }

    @Test
    void getMyDecks_shouldReturnEmptyList_withoutLoadingDecksOrCards() {
        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(userDeckProgressRepository.findLearningDeckSummaries(USER_ID)).thenReturn(List.of());

        List<LearningDeckResponse> result = learningService.getMyDecks();

        assertThat(result).isEmpty();
        verifyNoInteractions(deckRepository, userCardProgressRepository);
    }

    // --- getLearningDeck ---

    @Test
    void getLearningDeck_shouldReturnMetadataProgressAndCards_forActiveEnrollment() {
        UserDeckProgress deckProgress = deckProgressWithId();
        Deck deck = deck(DECK_ID, "English Basics");
        UserCardProgress mastered = cardProgress(USER_DECK_PROGRESS_ID, 3L, CardLearningStatus.MASTERED);
        UserCardProgress learning = cardProgress(USER_DECK_PROGRESS_ID, 4L, CardLearningStatus.LEARNING);
        List<UserCardProgress> progressRows = List.of(mastered, learning);
        List<Card> cards = List.of(card(3L, "hello"), card(4L, "world"));
        List<DeckCardResponse> cardResponses = List.of(
            deckCardResponse(cards.get(0), mastered),
            deckCardResponse(cards.get(1), learning)
        );
        LearningDeckResponse.ProgressSummary progress = new LearningDeckResponse.ProgressSummary(1, 2);
        LearningDeckDetailsResponse expected = new LearningDeckDetailsResponse(
            DECK_ID, "English Basics", Language.EN, Language.RU,
            deckProgress.getEnrolledAt(), deckProgress.getLastStudiedAt(), progress, cardResponses
        );

        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(userDeckProgressRepository.findByUserIdAndDeckIdAndStatus(USER_ID, DECK_ID, UserDeckStatus.ACTIVE))
            .thenReturn(Optional.of(deckProgress));
        when(deckRepository.findById(DECK_ID)).thenReturn(Optional.of(deck));
        when(userCardProgressRepository.findAllByUserDeckProgressId(USER_DECK_PROGRESS_ID))
            .thenReturn(progressRows);
        when(cardRepository.findAllById(List.of(3L, 4L))).thenReturn(cards);
        when(learningMapper.toDeckCardResponse(cards.get(0), mastered)).thenReturn(cardResponses.get(0));
        when(learningMapper.toDeckCardResponse(cards.get(1), learning)).thenReturn(cardResponses.get(1));
        when(learningMapper.toLearningDeckDetailsResponse(deckProgress, deck, progress, cardResponses))
            .thenReturn(expected);

        assertThat(learningService.getLearningDeck(DECK_ID)).isEqualTo(expected);
    }

    @Test
    void getLearningDeck_shouldRejectMissingOrInactiveEnrollment() {
        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(userDeckProgressRepository.findByUserIdAndDeckIdAndStatus(USER_ID, DECK_ID, UserDeckStatus.ACTIVE))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> learningService.getLearningDeck(DECK_ID))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("Deck not enrolled. Please enroll first.");
        verifyNoInteractions(deckRepository, cardRepository, userCardProgressRepository);
    }

    // --- getStudySession ---

    @Test
    void getStudySession_shouldReturnRepositorySelectedQueueInOrder() {
        UserDeckProgress deckProgress = deckProgressWithId();
        List<UserCardProgress> progress = List.of(
            cardProgress(USER_DECK_PROGRESS_ID, 10L, CardLearningStatus.LEARNING),
            cardProgress(USER_DECK_PROGRESS_ID, 30L, CardLearningStatus.LEARNING),
            cardProgress(USER_DECK_PROGRESS_ID, 20L, CardLearningStatus.REVIEWING),
            cardProgress(USER_DECK_PROGRESS_ID, 5L, CardLearningStatus.NEW)
        );
        List<Card> cards = progress.stream()
            .map(item -> card(item.getCardId(), "Card " + item.getCardId()))
            .toList();

        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(userDeckProgressRepository.findByUserIdAndDeckId(USER_ID, DECK_ID))
            .thenReturn(Optional.of(deckProgress));
        when(userCardProgressRepository.findStudyQueue(USER_DECK_PROGRESS_ID))
            .thenReturn(progress);
        when(cardRepository.findAllById(List.of(10L, 30L, 20L, 5L))).thenReturn(cards);
        when(learningMapper.toDeckCardResponse(any(Card.class), any(UserCardProgress.class)))
            .thenAnswer(invocation -> {
                Card mappedCard = invocation.getArgument(0);
                UserCardProgress mappedProgress = invocation.getArgument(1);
                return deckCardResponse(mappedCard, mappedProgress);
            });

        Deck deck = new Deck();
        deck.setId(DECK_ID);
        deck.setTitle("English Basics");
        when(deckRepository.findById(DECK_ID)).thenReturn(Optional.of(deck));

        StudySessionResponse session = learningService.getStudySession(DECK_ID);
        assertThat(session.deckId()).isEqualTo(DECK_ID);
        assertThat(session.deckTitle()).isEqualTo("English Basics");
        List<DeckCardResponse> result = session.cards();

        assertThat(result).extracting(DeckCardResponse::id)
            .containsExactly(10L, 30L, 20L, 5L);
        assertThat(result).extracting(response -> response.progress().status())
            .containsExactly(
                CardLearningStatus.LEARNING,
                CardLearningStatus.LEARNING,
                CardLearningStatus.REVIEWING,
                CardLearningStatus.NEW
            );
    }

    @Test
    void getStudySession_shouldLoadOnlyTheTenRowsReturnedByRepository() {
        UserDeckProgress deckProgress = deckProgressWithId();
        List<UserCardProgress> progress = List.of(
            cardProgress(USER_DECK_PROGRESS_ID, 1L, CardLearningStatus.LEARNING),
            cardProgress(USER_DECK_PROGRESS_ID, 2L, CardLearningStatus.LEARNING),
            cardProgress(USER_DECK_PROGRESS_ID, 3L, CardLearningStatus.LEARNING),
            cardProgress(USER_DECK_PROGRESS_ID, 4L, CardLearningStatus.LEARNING),
            cardProgress(USER_DECK_PROGRESS_ID, 5L, CardLearningStatus.REVIEWING),
            cardProgress(USER_DECK_PROGRESS_ID, 6L, CardLearningStatus.REVIEWING),
            cardProgress(USER_DECK_PROGRESS_ID, 7L, CardLearningStatus.REVIEWING),
            cardProgress(USER_DECK_PROGRESS_ID, 8L, CardLearningStatus.REVIEWING),
            cardProgress(USER_DECK_PROGRESS_ID, 9L, CardLearningStatus.NEW),
            cardProgress(USER_DECK_PROGRESS_ID, 10L, CardLearningStatus.NEW)
        );
        List<Long> cardIds = progress.stream().map(UserCardProgress::getCardId).toList();
        List<Card> cards = progress.stream()
            .map(item -> card(item.getCardId(), "Card " + item.getCardId()))
            .toList();

        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(userDeckProgressRepository.findByUserIdAndDeckId(USER_ID, DECK_ID))
            .thenReturn(Optional.of(deckProgress));
        when(userCardProgressRepository.findStudyQueue(USER_DECK_PROGRESS_ID))
            .thenReturn(progress);
        when(cardRepository.findAllById(cardIds)).thenReturn(cards);
        when(learningMapper.toDeckCardResponse(any(Card.class), any(UserCardProgress.class)))
            .thenAnswer(invocation -> {
                Card mappedCard = invocation.getArgument(0);
                UserCardProgress mappedProgress = invocation.getArgument(1);
                return deckCardResponse(mappedCard, mappedProgress);
            });

        Deck deck = new Deck();
        deck.setId(DECK_ID);
        deck.setTitle("English Basics");
        when(deckRepository.findById(DECK_ID)).thenReturn(Optional.of(deck));

        StudySessionResponse session = learningService.getStudySession(DECK_ID);
        assertThat(session.deckId()).isEqualTo(DECK_ID);
        assertThat(session.deckTitle()).isEqualTo("English Basics");
        List<DeckCardResponse> result = session.cards();

        assertThat(result).hasSize(10);
        assertThat(result).extracting(DeckCardResponse::id)
            .containsExactly(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L);
        verify(userCardProgressRepository, never()).findAllByUserDeckProgressId(any());
    }

    @Test
    void getStudySession_shouldReturnDeckMetadata_whenQueueIsEmpty() {
        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(userDeckProgressRepository.findByUserIdAndDeckId(USER_ID, DECK_ID))
            .thenReturn(Optional.of(deckProgressWithId()));
        when(userCardProgressRepository.findStudyQueue(USER_DECK_PROGRESS_ID)).thenReturn(List.of());
        Deck deck = new Deck();
        deck.setId(DECK_ID);
        deck.setTitle("Empty deck");
        when(deckRepository.findById(DECK_ID)).thenReturn(Optional.of(deck));

        StudySessionResponse result = learningService.getStudySession(DECK_ID);

        assertThat(result.deckId()).isEqualTo(DECK_ID);
        assertThat(result.deckTitle()).isEqualTo("Empty deck");
        assertThat(result.cards()).isEmpty();
    }

    @Test
    void getStudySession_shouldThrowNotFound_whenDeckDoesNotExist() {
        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);
        when(userDeckProgressRepository.findByUserIdAndDeckId(USER_ID, DECK_ID))
            .thenReturn(Optional.of(deckProgressWithId()));
        when(userCardProgressRepository.findStudyQueue(USER_DECK_PROGRESS_ID))
            .thenReturn(List.of());
        when(deckRepository.findById(DECK_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> learningService.getStudySession(DECK_ID))
            .isInstanceOf(EntityNotFoundException.class)
            .hasMessage("Deck not found: " + DECK_ID);
    }

    @Test
    void getStudySession_shouldRejectAccess_whenNotEnrolled() {
        when(securityUtils.getCurrentUserId()).thenReturn(USER_ID);

        assertThatThrownBy(() -> learningService.getStudySession(DECK_ID))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("Deck not enrolled. Please enroll first.");
        verifyNoInteractions(deckRepository, cardRepository, userCardProgressRepository);
    }

    private static DeckCardResponse deckCardResponse(Card card, UserCardProgress progress) {
        return new DeckCardResponse(
            card.getId(),
            card.getTitle(),
            card.getDefinition(),
            card.getSynonyms(),
            card.getExamples(),
            card.getTranslation(),
            new DeckCardResponse.CardProgressInfo(
                progress.getStatus(),
                progress.getTimesSeen(),
                progress.getTimesCorrect(),
                progress.getTimesWrong(),
                progress.getCorrectStreak()
            )
        );
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
