package com.llhelper.learning.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.llhelper.auth.entity.AuthUser;
import com.llhelper.card.entity.Card;
import com.llhelper.common.model.Language;
import com.llhelper.deck.entity.Deck;
import com.llhelper.learning.entity.UserCardProgress;
import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.CardLearningStatus;
import com.llhelper.learning.enums.UserDeckStatus;
import com.llhelper.learning.repository.UserDeckProgressRepository.LearningDeckSummaryProjection;
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
