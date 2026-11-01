package com.llhelper.learning.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.llhelper.auth.entity.AuthUser;
import com.llhelper.card.entity.Card;
import com.llhelper.card.repository.CardRepository;
import com.llhelper.common.model.Language;
import com.llhelper.deck.entity.Deck;
import com.llhelper.learning.entity.UserCardProgress;
import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.CardLearningStatus;
import com.llhelper.learning.enums.UserDeckStatus;
import com.llhelper.learning.repository.UserDeckProgressRepository.LearningDeckSummaryProjection;
import com.llhelper.learning.repository.UserDeckProgressRepository.LearningProgressSummaryProjection;
import com.llhelper.user.entity.User;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@Transactional
class LearningRepositoryTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.jpa.show-sql", () -> "false");
        registry.add("jwt.secret", () -> "01234567890123456789012345678901");
    }

    @Autowired
    private UserDeckProgressRepository userDeckProgressRepository;

    @Autowired
    private UserCardProgressRepository userCardProgressRepository;

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void findLearningDeckSummaries_shouldAggregateActiveEnrollmentsAndOrderByActivity() {
        User user = persistUser("learner@example.com", "learner");
        User otherUser = persistUser("other@example.com", "other");
        Deck studiedOlderDeck = persistDeck(user, "Studied older");
        Deck studiedNewerDeck = persistDeck(user, "Studied newer");
        Deck unstudiedDeck = persistDeck(user, "Unstudied");
        Deck pausedDeck = persistDeck(user, "Paused");
        Deck otherUserDeck = persistDeck(otherUser, "Other user");

        UserDeckProgress studiedOlder = persistEnrollment(
            user, studiedOlderDeck, UserDeckStatus.ACTIVE,
            Instant.parse("2024-01-01T00:00:00Z"), Instant.parse("2024-01-03T00:00:00Z")
        );
        UserDeckProgress studiedNewer = persistEnrollment(
            user, studiedNewerDeck, UserDeckStatus.ACTIVE,
            Instant.parse("2024-01-02T00:00:00Z"), Instant.parse("2024-01-04T00:00:00Z")
        );
        UserDeckProgress unstudied = persistEnrollment(
            user, unstudiedDeck, UserDeckStatus.ACTIVE,
            Instant.parse("2024-01-05T00:00:00Z"), null
        );
        persistEnrollment(user, pausedDeck, UserDeckStatus.PAUSED, Instant.EPOCH, null);
        persistEnrollment(otherUser, otherUserDeck, UserDeckStatus.ACTIVE, Instant.EPOCH, null);

        Card olderMastered = persistCard(studiedOlderDeck, "older mastered");
        Card olderLearning = persistCard(studiedOlderDeck, "older learning");
        Card newerMastered = persistCard(studiedNewerDeck, "newer mastered");
        persistCardProgress(user, studiedOlder, olderMastered, CardLearningStatus.MASTERED);
        persistCardProgress(user, studiedOlder, olderLearning, CardLearningStatus.LEARNING);
        persistCardProgress(user, studiedNewer, newerMastered, CardLearningStatus.MASTERED);

        entityManager.flush();
        entityManager.clear();

        List<LearningDeckSummaryProjection> rows = userDeckProgressRepository
            .findLearningDeckSummaries(user.getId());

        assertThat(rows).extracting(LearningDeckSummaryProjection::getDeckId)
            .containsExactly(studiedNewerDeck.getId(), studiedOlderDeck.getId(), unstudiedDeck.getId());
        assertThat(rows.get(0).getMasteredCount()).isOne();
        assertThat(rows.get(0).getTotalCount()).isOne();
        assertThat(rows.get(1).getMasteredCount()).isOne();
        assertThat(rows.get(1).getTotalCount()).isEqualTo(2);
        assertThat(rows.get(2).getMasteredCount()).isZero();
        assertThat(rows.get(2).getTotalCount()).isZero();
    }

    @Test
    void findStudyQueue_shouldExcludeMasteredOrderByPriorityAndLimitToTen() {
        User user = persistUser("study@example.com", "study");
        Deck deck = persistDeck(user, "Study deck");
        UserDeckProgress enrollment = persistEnrollment(
            user, deck, UserDeckStatus.ACTIVE, Instant.EPOCH, null
        );

        persistProgressRange(user, deck, enrollment, CardLearningStatus.NEW, 4);
        persistProgressRange(user, deck, enrollment, CardLearningStatus.REVIEWING, 4);
        persistProgressRange(user, deck, enrollment, CardLearningStatus.LEARNING, 4);
        persistProgressRange(user, deck, enrollment, CardLearningStatus.MASTERED, 2);

        entityManager.flush();
        entityManager.clear();

        List<UserCardProgress> queue = userCardProgressRepository.findStudyQueue(enrollment.getId());

        assertThat(queue).hasSize(10);
        assertThat(queue).extracting(UserCardProgress::getStatus)
            .containsExactly(
                CardLearningStatus.LEARNING,
                CardLearningStatus.LEARNING,
                CardLearningStatus.LEARNING,
                CardLearningStatus.LEARNING,
                CardLearningStatus.REVIEWING,
                CardLearningStatus.REVIEWING,
                CardLearningStatus.REVIEWING,
                CardLearningStatus.REVIEWING,
                CardLearningStatus.NEW,
                CardLearningStatus.NEW
            );
        assertThat(queue).noneMatch(progress -> progress.getStatus() == CardLearningStatus.MASTERED);
        assertThat(queue.subList(0, 4)).extracting(UserCardProgress::getCardId).isSorted();
        assertThat(queue.subList(4, 8)).extracting(UserCardProgress::getCardId).isSorted();
        assertThat(queue.subList(8, 10)).extracting(UserCardProgress::getCardId).isSorted();
    }

    @Test
    void activeLearningQueries_shouldExcludeDeletedContentAndPreserveProgressRows() {
        User user = persistUser("deleted-learning@example.com", "deleted-learning");
        Deck deck = persistDeck(user, "Deck with deleted card");
        UserDeckProgress enrollment = persistEnrollment(
            user, deck, UserDeckStatus.ACTIVE, Instant.EPOCH, null
        );
        Card activeCard = persistCard(deck, "Active card");
        Card deletedCard = persistCard(deck, "Deleted card");
        persistCardProgress(user, enrollment, activeCard, CardLearningStatus.LEARNING);
        persistCardProgress(user, enrollment, deletedCard, CardLearningStatus.MASTERED);
        deletedCard.setDeletedAt(Instant.parse("2026-10-31T12:00:00Z"));
        entityManager.flush();
        entityManager.clear();

        assertThat(userCardProgressRepository.findStudyQueue(enrollment.getId()))
            .extracting(UserCardProgress::getCardId)
            .containsExactly(activeCard.getId());
        assertThat(userCardProgressRepository.findAllActiveByUserDeckProgressId(enrollment.getId()))
            .extracting(UserCardProgress::getCardId)
            .containsExactly(activeCard.getId());
        assertThat(userCardProgressRepository.findAll()).hasSize(2);
        assertThat(cardRepository.findActiveByIdForUpdate(activeCard.getId())).isPresent();
        assertThat(cardRepository.findAllById(List.of(activeCard.getId(), deletedCard.getId())))
            .extracting(Card::getId)
            .containsExactly(activeCard.getId());
        assertThat(cardRepository.findById(deletedCard.getId())).isEmpty();
        assertThat(cardRepository.findActiveByIdForUpdate(deletedCard.getId())).isEmpty();
        assertThat(userDeckProgressRepository.findLearningProgressSummaries(user.getId()))
            .singleElement()
            .satisfies(summary -> {
                assertThat(summary.getLearningCount()).isOne();
                assertThat(summary.getMasteredCount()).isZero();
                assertThat(summary.getTotalCards()).isOne();
            });

        Deck persistedDeck = entityManager.find(Deck.class, deck.getId());
        persistedDeck.setDeletedAt(Instant.parse("2026-10-31T13:00:00Z"));
        entityManager.flush();
        entityManager.clear();

        assertThat(userCardProgressRepository.findStudyQueue(enrollment.getId())).isEmpty();
        assertThat(userDeckProgressRepository.findLearningDeckSummaries(user.getId())).isEmpty();
        assertThat(userDeckProgressRepository.findLearningProgressSummaries(user.getId())).isEmpty();
        assertThat(userCardProgressRepository.findAll()).hasSize(2);
    }

    @Test
    void existsByCardDeckId_shouldFindProgressEvenWhenEnrollmentReferencesAnotherDeck() {
        User user = persistUser("cross-reference@example.com", "cross-reference");
        Deck cardDeck = persistDeck(user, "Card deck");
        Deck enrollmentDeck = persistDeck(user, "Enrollment deck");
        Card card = persistCard(cardDeck, "Cross-referenced card");
        UserDeckProgress enrollment = persistEnrollment(
            user, enrollmentDeck, UserDeckStatus.ACTIVE, Instant.EPOCH, null
        );
        persistCardProgress(user, enrollment, card, CardLearningStatus.NEW);
        entityManager.flush();
        entityManager.clear();

        assertThat(userCardProgressRepository.existsByCardDeckId(cardDeck.getId())).isTrue();
        assertThat(userCardProgressRepository.existsByCardDeckId(enrollmentDeck.getId())).isFalse();
    }

    @Test
    void insertMissingForActiveEnrollments_shouldCreateNewProgressIdempotently() {
        User owner = persistUser("owner-provisioning@example.com", "owner-provisioning");
        User firstLearner = persistUser("first-provisioning@example.com", "first-provisioning");
        User secondLearner = persistUser("second-provisioning@example.com", "second-provisioning");
        User pausedLearner = persistUser("paused-provisioning@example.com", "paused-provisioning");
        Deck deck = persistDeck(owner, "Provisioning deck");
        UserDeckProgress firstEnrollment = persistEnrollment(
            firstLearner, deck, UserDeckStatus.ACTIVE, Instant.EPOCH, null
        );
        UserDeckProgress secondEnrollment = persistEnrollment(
            secondLearner, deck, UserDeckStatus.ACTIVE, Instant.EPOCH, null
        );
        UserDeckProgress pausedEnrollment = persistEnrollment(
            pausedLearner, deck, UserDeckStatus.PAUSED, Instant.EPOCH, null
        );
        Card card = persistCard(deck, "new after enrollment");
        entityManager.flush();

        int inserted = userCardProgressRepository.insertMissingForActiveEnrollments(
            deck.getId(), card.getId()
        );
        int insertedAgain = userCardProgressRepository.insertMissingForActiveEnrollments(
            deck.getId(), card.getId()
        );
        entityManager.flush();
        entityManager.clear();

        assertThat(inserted).isEqualTo(2);
        assertThat(insertedAgain).isZero();
        assertThat(userCardProgressRepository.findByUserDeckProgressIdAndCardId(
            firstEnrollment.getId(), card.getId()
        )).get()
            .extracting(
                UserCardProgress::getUserId,
                UserCardProgress::getStatus,
                UserCardProgress::getTimesSeen,
                UserCardProgress::getTimesCorrect,
                UserCardProgress::getTimesWrong,
                UserCardProgress::getCorrectStreak
            )
            .containsExactly(
                firstLearner.getId(), CardLearningStatus.NEW, 0, 0, 0, 0
            );
        assertThat(userCardProgressRepository.findByUserDeckProgressIdAndCardId(
            secondEnrollment.getId(), card.getId()
        )).isPresent();
        assertThat(userCardProgressRepository.findByUserDeckProgressIdAndCardId(
            pausedEnrollment.getId(), card.getId()
        )).isEmpty();
        assertThat(userCardProgressRepository.findStudyQueue(firstEnrollment.getId()))
            .extracting(UserCardProgress::getCardId)
            .containsExactly(card.getId());
        assertThat(userCardProgressRepository.findAllActiveByUserDeckProgressId(firstEnrollment.getId()))
            .extracting(UserCardProgress::getCardId)
            .containsExactly(card.getId());
        assertThat(userDeckProgressRepository.findLearningProgressSummaries(firstLearner.getId()))
            .singleElement()
            .satisfies(summary -> {
                assertThat(summary.getNewCount()).isOne();
                assertThat(summary.getTotalCards()).isOne();
            });
    }

    @Test
    void findLearningProgressSummaries_shouldCountStatusesAndOrderByNewestEnrollment() {
        User user = persistUser("progress@example.com", "progress");
        User otherUser = persistUser("other-progress@example.com", "other-progress");
        Deck activeDeck = persistDeck(user, "Active deck");
        Deck emptyDeck = persistDeck(user, "Empty deck");
        Deck pausedDeck = persistDeck(user, "Paused deck");
        Deck otherDeck = persistDeck(otherUser, "Other deck");
        UserDeckProgress activeEnrollment = persistEnrollment(
            user, activeDeck, UserDeckStatus.ACTIVE,
            Instant.parse("2024-01-01T00:00:00Z"), null
        );
        persistEnrollment(
            user, emptyDeck, UserDeckStatus.ACTIVE,
            Instant.parse("2024-01-02T00:00:00Z"), null
        );
        UserDeckProgress pausedEnrollment = persistEnrollment(
            user, pausedDeck, UserDeckStatus.PAUSED, Instant.EPOCH, null
        );
        UserDeckProgress otherEnrollment = persistEnrollment(
            otherUser, otherDeck, UserDeckStatus.ACTIVE, Instant.EPOCH, null
        );

        persistCardProgress(user, activeEnrollment, persistCard(activeDeck, "new"), CardLearningStatus.NEW);
        persistCardProgress(user, activeEnrollment, persistCard(activeDeck, "learning"), CardLearningStatus.LEARNING);
        persistCardProgress(user, activeEnrollment, persistCard(activeDeck, "reviewing"), CardLearningStatus.REVIEWING);
        persistCardProgress(user, activeEnrollment, persistCard(activeDeck, "mastered"), CardLearningStatus.MASTERED);
        persistCardProgress(user, pausedEnrollment, persistCard(pausedDeck, "paused"), CardLearningStatus.MASTERED);
        persistCardProgress(otherUser, otherEnrollment, persistCard(otherDeck, "other"), CardLearningStatus.MASTERED);

        entityManager.flush();
        entityManager.clear();

        List<LearningProgressSummaryProjection> rows = userDeckProgressRepository
            .findLearningProgressSummaries(user.getId());

        assertThat(rows).extracting(LearningProgressSummaryProjection::getDeckId)
            .containsExactly(emptyDeck.getId(), activeDeck.getId());
        LearningProgressSummaryProjection active = rows.get(1);
        assertThat(active.getNewCount()).isOne();
        assertThat(active.getLearningCount()).isOne();
        assertThat(active.getReviewingCount()).isOne();
        assertThat(active.getMasteredCount()).isOne();
        assertThat(active.getTotalCards()).isEqualTo(4);
        assertThat(rows.get(0).getTotalCards()).isZero();
    }

    private void persistProgressRange(
        User user,
        Deck deck,
        UserDeckProgress enrollment,
        CardLearningStatus status,
        int count
    ) {
        for (int index = 0; index < count; index++) {
            Card card = persistCard(deck, status + " " + index);
            persistCardProgress(user, enrollment, card, status);
        }
    }

    private User persistUser(String email, String username) {
        AuthUser authUser = new AuthUser();
        authUser.setEmail(email);
        authUser.setPasswordHash("hash");
        entityManager.persist(authUser);

        User user = new User();
        user.setAuthUser(authUser);
        user.setFirstName("First");
        user.setLastName("Learner");
        user.setUsername(username);
        user.setNativeLanguage("EN");
        user.setTargetLanguage("RU");
        user.setUiLanguage("EN");
        entityManager.persist(user);
        return user;
    }

    private Deck persistDeck(User owner, String title) {
        Deck deck = new Deck();
        deck.setOwner(owner);
        deck.setTitle(title);
        deck.setSourceLanguage(Language.EN);
        deck.setTargetLanguage(Language.RU);
        deck.setIsPublic(true);
        entityManager.persist(deck);
        return deck;
    }

    private Card persistCard(Deck deck, String title) {
        Card card = new Card();
        card.setDeck(deck);
        card.setTitle(title);
        card.setTranslation(title);
        entityManager.persist(card);
        return card;
    }

    private UserDeckProgress persistEnrollment(
        User user,
        Deck deck,
        UserDeckStatus status,
        Instant enrolledAt,
        Instant lastStudiedAt
    ) {
        UserDeckProgress progress = new UserDeckProgress();
        progress.setUserId(user.getId());
        progress.setDeckId(deck.getId());
        progress.setEnrolledAt(enrolledAt);
        progress.setLastStudiedAt(lastStudiedAt);
        progress.setStatus(status);
        entityManager.persist(progress);
        return progress;
    }

    private void persistCardProgress(
        User user,
        UserDeckProgress enrollment,
        Card card,
        CardLearningStatus status
    ) {
        UserCardProgress progress = new UserCardProgress();
        progress.setUserId(user.getId());
        progress.setUserDeckProgressId(enrollment.getId());
        progress.setCardId(card.getId());
        progress.setStatus(status);
        entityManager.persist(progress);
    }
}
