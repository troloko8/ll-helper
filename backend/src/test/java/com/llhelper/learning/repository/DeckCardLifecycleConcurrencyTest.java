package com.llhelper.learning.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.llhelper.auth.entity.AuthUser;
import com.llhelper.card.dto.request.CardRequest;
import com.llhelper.card.entity.Card;
import com.llhelper.card.service.CardService;
import com.llhelper.common.model.Language;
import com.llhelper.deck.entity.Deck;
import com.llhelper.deck.service.DeckService;
import com.llhelper.learning.service.LearningService;
import com.llhelper.user.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class DeckCardLifecycleConcurrencyTest {

    private static final AtomicLong FIXTURE_SEQUENCE = new AtomicLong();

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
    private LearningService learningService;

    @Autowired
    private DeckService deckService;

    @Autowired
    private CardService cardService;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void deckDelete_shouldSoftDeleteAndPreserveLearnerRows_whenEnrollmentCommitsFirst() throws Exception {
        Fixture fixture = createFixture(true);
        CountDownLatch enrollmentReady = new CountDownLatch(1);
        CountDownLatch releaseEnrollment = new CountDownLatch(1);
        CountDownLatch deleteStarted = new CountDownLatch(1);
        CountDownLatch deleteAcquiredLock = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<?> enrollment = executor.submit(() -> inTransaction(() -> {
                asUser(fixture.learnerEmail(), () -> {
                    learningService.enrollDeck(fixture.deckId());
                    enrollmentReady.countDown();
                    await(releaseEnrollment);
                });
            }));
            await(enrollmentReady);

            Future<?> deletion = executor.submit(() -> {
                deleteStarted.countDown();
                asUser(fixture.ownerEmail(), () -> deckService.delete(fixture.deckId()));
                deleteAcquiredLock.countDown();
            });

            await(deleteStarted);
            assertThat(deleteAcquiredLock.await(300, TimeUnit.MILLISECONDS)).isFalse();
            releaseEnrollment.countDown();
            enrollment.get(5, TimeUnit.SECONDS);

            deletion.get(5, TimeUnit.SECONDS);
            assertThat(deleteAcquiredLock.getCount()).isZero();
        } finally {
            releaseEnrollment.countDown();
            shutdown(executor);
        }

        assertThat(count("SELECT COUNT(*) FROM decks WHERE id = ? AND deleted_at IS NOT NULL",
            fixture.deckId())).isOne();
        assertThat(count("SELECT COUNT(*) FROM user_deck_progress WHERE deck_id = ?",
            fixture.deckId())).isOne();
        assertThat(count("SELECT COUNT(*) FROM user_card_progress WHERE card_id = ?",
            fixture.cardId())).isOne();
    }

    @Test
    void cardDelete_shouldSoftDeleteAndPreserveProgress_whenEnrollmentCommitsFirst() throws Exception {
        Fixture fixture = createFixture(true);
        CountDownLatch enrollmentReady = new CountDownLatch(1);
        CountDownLatch releaseEnrollment = new CountDownLatch(1);
        CountDownLatch deleteStarted = new CountDownLatch(1);
        CountDownLatch deleteAcquiredDeckLock = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<?> enrollment = executor.submit(() -> inTransaction(() -> {
                asUser(fixture.learnerEmail(), () -> {
                    learningService.enrollDeck(fixture.deckId());
                    enrollmentReady.countDown();
                    await(releaseEnrollment);
                });
            }));
            await(enrollmentReady);

            Future<?> deletion = executor.submit(() -> {
                deleteStarted.countDown();
                asUser(fixture.ownerEmail(), () -> cardService.delete(fixture.cardId()));
                deleteAcquiredDeckLock.countDown();
            });

            await(deleteStarted);
            assertThat(deleteAcquiredDeckLock.await(300, TimeUnit.MILLISECONDS)).isFalse();
            releaseEnrollment.countDown();
            enrollment.get(5, TimeUnit.SECONDS);

            deletion.get(5, TimeUnit.SECONDS);
            assertThat(deleteAcquiredDeckLock.getCount()).isZero();
        } finally {
            releaseEnrollment.countDown();
            shutdown(executor);
        }

        assertThat(count("SELECT COUNT(*) FROM cards WHERE id = ? AND deleted_at IS NOT NULL",
            fixture.cardId())).isOne();
        assertThat(count("SELECT COUNT(*) FROM user_card_progress WHERE card_id = ?",
            fixture.cardId())).isOne();
    }

    @Test
    void cardCreate_shouldNotWriteIntoDeletedDeck_whenDeckHardDeleteCommitsFirst() throws Exception {
        Fixture fixture = createFixture(false);
        CountDownLatch deleteReady = new CountDownLatch(1);
        CountDownLatch releaseDelete = new CountDownLatch(1);
        CountDownLatch createStarted = new CountDownLatch(1);
        CountDownLatch createFinishedDeckLookup = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<?> deletion = executor.submit(() -> inTransaction(() -> {
                asUser(fixture.ownerEmail(), () -> {
                    deckService.delete(fixture.deckId());
                    entityManager.flush();
                    deleteReady.countDown();
                    await(releaseDelete);
                });
            }));
            await(deleteReady);

            Future<Boolean> creation = executor.submit(() -> {
                createStarted.countDown();
                try {
                    asUser(fixture.ownerEmail(), () -> cardService.create(
                        fixture.deckId(),
                        new CardRequest("Late card", null, List.of(), List.of(), "Late card")
                    ));
                    return true;
                } catch (EntityNotFoundException exception) {
                    return false;
                } finally {
                    createFinishedDeckLookup.countDown();
                }
            });

            await(createStarted);
            assertThat(createFinishedDeckLookup.await(300, TimeUnit.MILLISECONDS)).isFalse();
            releaseDelete.countDown();
            deletion.get(5, TimeUnit.SECONDS);

            assertThat(creation.get(5, TimeUnit.SECONDS)).isFalse();
            assertThat(createFinishedDeckLookup.getCount()).isZero();
        } finally {
            releaseDelete.countDown();
            shutdown(executor);
        }

        assertThat(count("SELECT COUNT(*) FROM decks WHERE id = ?", fixture.deckId())).isZero();
        assertThat(count("SELECT COUNT(*) FROM cards WHERE deck_id = ?", fixture.deckId())).isZero();
    }

    private Fixture createFixture(boolean withCard) {
        return inTransaction(() -> {
            long suffix = FIXTURE_SEQUENCE.incrementAndGet();
            User owner = persistUser("lifecycle-owner-" + suffix + "@example.com", "lifecycle-owner-" + suffix);
            User learner = persistUser("lifecycle-learner-" + suffix + "@example.com", "lifecycle-learner-" + suffix);
            Deck deck = persistDeck(owner, "Lifecycle deck " + suffix);
            Card card = withCard ? persistCard(deck, "Lifecycle card " + suffix) : null;
            entityManager.flush();
            return new Fixture(
                owner.getAuthUser().getEmail(),
                learner.getAuthUser().getEmail(),
                deck.getId(),
                card == null ? null : card.getId()
            );
        });
    }

    private User persistUser(String email, String username) {
        AuthUser authUser = new AuthUser();
        authUser.setEmail(email);
        authUser.setPasswordHash("hash");
        entityManager.persist(authUser);

        User user = new User();
        user.setAuthUser(authUser);
        user.setFirstName("Lifecycle");
        user.setLastName("Concurrency");
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

    private long count(String sql, Object... arguments) {
        Long result = jdbcTemplate.queryForObject(sql, Long.class, arguments);
        return result == null ? 0 : result;
    }

    private static void asUser(String email, Runnable work) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(
            new UsernamePasswordAuthenticationToken(email, "credentials", List.of())
        );
        SecurityContextHolder.setContext(context);
        try {
            work.run();
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void inTransaction(Runnable work) {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> work.run());
    }

    private <T> T inTransaction(java.util.concurrent.Callable<T> work) {
        T result = new TransactionTemplate(transactionManager).execute(status -> {
            try {
                return work.call();
            } catch (Exception exception) {
                throw new IllegalStateException(exception);
            }
        });
        if (result == null) {
            throw new IllegalStateException("Transaction returned no result");
        }
        return result;
    }

    private static void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out waiting for concurrent transaction");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for concurrent transaction", exception);
        }
    }

    private static void shutdown(ExecutorService executor) {
        executor.shutdownNow();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Concurrent test executor did not stop");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while stopping concurrent test executor", exception);
        }
    }

    private record Fixture(String ownerEmail, String learnerEmail, Long deckId, Long cardId) {}
}
