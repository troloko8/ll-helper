package com.llhelper.deck.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.llhelper.auth.entity.AuthUser;
import com.llhelper.card.entity.Card;
import com.llhelper.common.model.Language;
import com.llhelper.deck.entity.Deck;
import com.llhelper.deck.repository.DeckRepository.OwnedDeckListProjection;
import com.llhelper.deck.repository.DeckRepository.PublicDeckListProjection;
import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.UserDeckStatus;
import com.llhelper.user.entity.User;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Map;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@Transactional
class DeckRepositoryTest {

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
    private DeckRepository deckRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Test
    void findPublicDecksAndFindOwnedDecks_shouldCountCardsAndPreserveVisibilityScopes_whenDecksHaveMixedOwnershipAndVisibility() {
        User firstOwner = persistUser("first@example.com", "first-owner");
        User secondOwner = persistUser("second@example.com", "second-owner");
        Deck publicDeck = persistDeck(firstOwner, "Public", true);
        Deck otherPublicDeck = persistDeck(secondOwner, "Other public", true);
        persistDeck(secondOwner, "Public empty", true);
        persistDeck(firstOwner, "Private empty", false);

        persistCard(publicDeck, "one");
        persistCard(publicDeck, "two");
        persistCard(otherPublicDeck, "other");
        persistEnrollment(firstOwner, publicDeck, UserDeckStatus.ACTIVE);
        persistEnrollment(firstOwner, otherPublicDeck, UserDeckStatus.PAUSED);
        persistEnrollment(secondOwner, otherPublicDeck, UserDeckStatus.ACTIVE);
        
        entityManager.flush();
        entityManager.clear();

        List<PublicDeckListProjection> publicRows = deckRepository.findPublicDecks(firstOwner.getId());
        List<OwnedDeckListProjection> ownedRows = deckRepository.findOwnedDecks(firstOwner.getId());

        assertThat(publicRows).hasSize(3);
        assertThat(publicRows)
            .filteredOn(row -> row.getTitle().equals("Public"))
            .singleElement()
            .satisfies(row -> {
                assertThat(row.getOwnerId()).isEqualTo(firstOwner.getId());
                assertThat(row.getOwnerUsername()).isEqualTo("first-owner");
                assertThat(row.getOwnerFirstName()).isEqualTo("First");
                assertThat(row.getCardCount()).isEqualTo(2);
                assertThat(row.getIsEnrolled()).isTrue();
            });
        assertThat(publicRows)
            .filteredOn(row -> row.getTitle().equals("Other public"))
            .singleElement()
            .satisfies(row -> {
                assertThat(row.getOwnerId()).isEqualTo(secondOwner.getId());
                assertThat(row.getOwnerUsername()).isEqualTo("second-owner");
                assertThat(row.getIsEnrolled()).isFalse();
            });
        assertThat(publicRows)
            .filteredOn(row -> row.getTitle().equals("Public empty"))
            .singleElement()
            .satisfies(row -> {
                assertThat(row.getCardCount()).isZero();
                assertThat(row.getIsEnrolled()).isFalse();
            });
        assertThat(publicRows).noneMatch(row -> row.getTitle().equals("Private empty"));

        assertThat(ownedRows).hasSize(2);
        assertThat(ownedRows)
            .filteredOn(row -> row.getTitle().equals("Private empty"))
            .singleElement()
            .satisfies(row -> {
                assertThat(row.getIsPublic()).isFalse();
                assertThat(row.getCardCount()).isZero();
            });
        assertThat(ownedRows).noneMatch(row -> row.getTitle().equals("Other public"));
    }

    @Test
    void schema_shouldContainCardsDeckIndex_whenMigrationsAreApplied() {
        Long indexCount = jdbcTemplate.queryForObject("""
            select count(*)
            from pg_indexes
            where schemaname = 'public'
                and tablename = 'cards'
                and indexname = 'idx_cards_deck_id'
            """, Map.of(), Long.class);

        assertThat(indexCount).isOne();
    }

    private User persistUser(String email, String username) {
        AuthUser authUser = new AuthUser();
        authUser.setEmail(email);
        authUser.setPasswordHash("hash");
        entityManager.persist(authUser);

        User user = new User();
        user.setAuthUser(authUser);
        user.setFirstName("First");
        user.setLastName("Owner");
        user.setUsername(username);
        user.setNativeLanguage("EN");
        user.setTargetLanguage("RU");
        user.setUiLanguage("EN");
        entityManager.persist(user);
        return user;
    }

    private Deck persistDeck(User owner, String title, boolean isPublic) {
        Deck deck = new Deck();
        deck.setOwner(owner);
        deck.setTitle(title);
        deck.setDescription("Description");
        deck.setSourceLanguage(Language.EN);
        deck.setTargetLanguage(Language.RU);
        deck.setIsPublic(isPublic);
        entityManager.persist(deck);
        return deck;
    }

    private void persistCard(Deck deck, String title) {
        Card card = new Card();
        card.setDeck(deck);
        card.setTitle(title);
        card.setTranslation(title);
        entityManager.persist(card);
    }

    private void persistEnrollment(User user, Deck deck, UserDeckStatus status) {
        UserDeckProgress progress = new UserDeckProgress();
        progress.setUserId(user.getId());
        progress.setDeckId(deck.getId());
        progress.setEnrolledAt(Instant.EPOCH);
        progress.setStatus(status);
        entityManager.persist(progress);
    }
}
