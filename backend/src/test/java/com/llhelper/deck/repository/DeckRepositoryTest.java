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
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
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

        Page<PublicDeckListProjection> publicPage = deckRepository.findPublicDecks(
            firstOwner.getId(), null, null, null, null, "NEWEST", PageRequest.of(0, 12)
        );
        List<PublicDeckListProjection> publicRows = publicPage.getContent();
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
    void findPublicDecks_shouldSearchByTitleCaseInsensitively_whenTitleContainsQuery() {
        User currentUser = persistUser("current@example.com", "current-user");
        User owner = persistUser("owner@example.com", "unrelated-owner");
        persistDeck(owner, "A MiXeD Phrasebook", true);
        persistDeck(owner, "Another public deck", true);
        persistDeck(owner, "Private mixed phrasebook", false);
        entityManager.flush();
        entityManager.clear();

        Page<PublicDeckListProjection> page = findPublicDecks(
            currentUser.getId(), "mixed", null, "NEWEST", 0, 12
        );

        assertThat(titles(page)).containsExactly("A MiXeD Phrasebook");
    }

    @Test
    void findPublicDecks_shouldSearchByOwnerUsernameCaseInsensitively_whenUsernameContainsQuery() {
        User currentUser = persistUser("current@example.com", "current-user");
        User matchingOwner = persistUser("matching@example.com", "PolyGlot-Owner");
        User otherOwner = persistUser("other@example.com", "another-owner");
        persistDeck(matchingOwner, "First unrelated title", true);
        persistDeck(otherOwner, "Second unrelated title", true);
        entityManager.flush();
        entityManager.clear();

        Page<PublicDeckListProjection> page = findPublicDecks(
            currentUser.getId(), "polyglot", null, "NEWEST", 0, 12
        );

        assertThat(page.getContent()).singleElement().satisfies(row -> {
            assertThat(row.getTitle()).isEqualTo("First unrelated title");
            assertThat(row.getOwnerUsername()).isEqualTo("PolyGlot-Owner");
        });
    }

    @Test
    void findPublicDecks_shouldTreatPercentAndUnderscoreLiterally_whenQueryIsEscaped() {
        User currentUser = persistUser("current@example.com", "current-user");
        User owner = persistUser("owner@example.com", "owner");
        persistDeck(owner, "Symbols %_ handbook", true);
        persistDeck(owner, "Symbols wildcard handbook", true);
        entityManager.flush();
        entityManager.clear();

        Page<PublicDeckListProjection> page = findPublicDecks(
            currentUser.getId(), "\\%\\_", null, "NEWEST", 0, 12
        );

        assertThat(titles(page)).containsExactly("Symbols %_ handbook");
    }

    @Test
    void findPublicDecks_shouldIncludeOnlyActiveEnrollment_whenEnrolledIsTrue() {
        User currentUser = persistUser("current@example.com", "current-user");
        User owner = persistUser("owner@example.com", "owner");
        Deck active = persistDeck(owner, "Active enrollment", true);
        Deck paused = persistDeck(owner, "Paused enrollment", true);
        Deck archived = persistDeck(owner, "Archived enrollment", true);
        persistDeck(owner, "Never enrolled", true);
        persistEnrollment(currentUser, active, UserDeckStatus.ACTIVE);
        persistEnrollment(currentUser, paused, UserDeckStatus.PAUSED);
        persistEnrollment(currentUser, archived, UserDeckStatus.ARCHIVED);
        entityManager.flush();
        entityManager.clear();

        Page<PublicDeckListProjection> page = findPublicDecks(
            currentUser.getId(), null, true, "NEWEST", 0, 12
        );

        assertThat(titles(page)).containsExactly("Active enrollment");
        assertThat(page.getContent()).allMatch(PublicDeckListProjection::getIsEnrolled);
    }

    @Test
    void findPublicDecks_shouldIncludeInactiveAndMissingEnrollments_whenEnrolledIsFalse() {
        User currentUser = persistUser("current@example.com", "current-user");
        User owner = persistUser("owner@example.com", "owner");
        Deck active = persistDeck(owner, "Active enrollment", true);
        Deck paused = persistDeck(owner, "Paused enrollment", true);
        Deck archived = persistDeck(owner, "Archived enrollment", true);
        Deck neverEnrolled = persistDeck(owner, "Never enrolled", true);
        persistEnrollment(currentUser, active, UserDeckStatus.ACTIVE);
        persistEnrollment(currentUser, paused, UserDeckStatus.PAUSED);
        persistEnrollment(currentUser, archived, UserDeckStatus.ARCHIVED);
        entityManager.flush();
        entityManager.clear();

        Page<PublicDeckListProjection> page = findPublicDecks(
            currentUser.getId(), null, false, "TITLE_ASC", 0, 12
        );

        assertThat(titles(page)).containsExactly(
            archived.getTitle(), neverEnrolled.getTitle(), paused.getTitle()
        );
        assertThat(page.getContent()).noneMatch(PublicDeckListProjection::getIsEnrolled);
    }

    @Test
    void findPublicDecks_shouldFilterByBothLanguages_whenLanguagePairIsProvided() {
        User currentUser = persistUser("current@example.com", "current-user");
        User owner = persistUser("owner@example.com", "owner");
        persistDeck(owner, "English to Russian", true);
        Deck wrongSource = persistDeck(owner, "German to Russian", true);
        wrongSource.setSourceLanguage(Language.DE);
        Deck wrongTarget = persistDeck(owner, "English to German", true);
        wrongTarget.setTargetLanguage(Language.DE);
        entityManager.flush();
        entityManager.clear();

        Page<PublicDeckListProjection> page = deckRepository.findPublicDecks(
            currentUser.getId(), null, "EN", "RU", null,
            "NEWEST", PageRequest.of(0, 12)
        );

        assertThat(titles(page)).containsExactly("English to Russian");
    }

    @Test
    void findPublicDecks_shouldSortNewestByCreatedAtThenIdDescending() {
        User currentUser = persistUser("current@example.com", "current-user");
        User owner = persistUser("owner@example.com", "owner");
        Deck oldest = persistDeck(owner, "Oldest", true);
        Deck tiedFirst = persistDeck(owner, "Newest lower id", true);
        Deck tiedSecond = persistDeck(owner, "Newest higher id", true);
        entityManager.flush();
        setCreatedAt(oldest, Instant.parse("2026-01-01T00:00:00Z"));
        setCreatedAt(tiedFirst, Instant.parse("2026-02-01T00:00:00Z"));
        setCreatedAt(tiedSecond, Instant.parse("2026-02-01T00:00:00Z"));
        entityManager.clear();

        Page<PublicDeckListProjection> page = findPublicDecks(
            currentUser.getId(), null, null, "NEWEST", 0, 12
        );

        assertThat(titles(page)).containsExactly(
            tiedSecond.getTitle(), tiedFirst.getTitle(), oldest.getTitle()
        );
    }

    @Test
    void findPublicDecks_shouldSortTitleAscendingThenIdAscending() {
        User currentUser = persistUser("current@example.com", "current-user");
        User owner = persistUser("owner@example.com", "owner");
        Deck tiedFirst = persistDeck(owner, "Alpha", true);
        Deck tiedSecond = persistDeck(owner, "alpha", true);
        Deck last = persistDeck(owner, "Beta", true);
        entityManager.flush();
        entityManager.clear();

        Page<PublicDeckListProjection> page = findPublicDecks(
            currentUser.getId(), null, null, "TITLE_ASC", 0, 12
        );

        assertThat(titles(page)).containsExactly(
            tiedFirst.getTitle(), tiedSecond.getTitle(), last.getTitle()
        );
    }

    @Test
    void findPublicDecks_shouldSortCardCountDescendingThenIdDescending() {
        User currentUser = persistUser("current@example.com", "current-user");
        User owner = persistUser("owner@example.com", "owner");
        Deck zeroCards = persistDeck(owner, "Zero cards", true);
        Deck tiedFirst = persistDeck(owner, "One card lower id", true);
        Deck tiedSecond = persistDeck(owner, "One card higher id", true);
        persistCard(tiedFirst, "first");
        persistCard(tiedSecond, "second");
        entityManager.flush();
        entityManager.clear();

        Page<PublicDeckListProjection> page = findPublicDecks(
            currentUser.getId(), null, null, "CARD_COUNT_DESC", 0, 12
        );

        assertThat(titles(page)).containsExactly(
            tiedSecond.getTitle(), tiedFirst.getTitle(), zeroCards.getTitle()
        );
    }

    @Test
    void findPublicDecks_shouldReturnEmptyContentWithTotals_whenPageIsOutOfRange() {
        User currentUser = persistUser("current@example.com", "current-user");
        User owner = persistUser("owner@example.com", "owner");
        persistDeck(owner, "First", true);
        persistDeck(owner, "Second", true);
        entityManager.flush();
        entityManager.clear();

        Page<PublicDeckListProjection> page = findPublicDecks(
            currentUser.getId(), null, null, "NEWEST", 5, 1
        );

        assertThat(page.getContent()).isEmpty();
        assertThat(page.getNumber()).isEqualTo(5);
        assertThat(page.getSize()).isOne();
        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getTotalPages()).isEqualTo(2);
        assertThat(page.hasNext()).isFalse();
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

    private Page<PublicDeckListProjection> findPublicDecks(
        Long userId,
        String query,
        Boolean enrolled,
        String sort,
        int page,
        int size
    ) {
        return deckRepository.findPublicDecks(
            userId, query, null, null, enrolled, sort, PageRequest.of(page, size)
        );
    }

    private List<String> titles(Page<PublicDeckListProjection> page) {
        return page.getContent().stream()
            .map(PublicDeckListProjection::getTitle)
            .toList();
    }

    private void setCreatedAt(Deck deck, Instant createdAt) {
        jdbcTemplate.update(
            "update decks set created_at = :createdAt where id = :id",
            Map.of("createdAt", createdAt.atOffset(ZoneOffset.UTC), "id", deck.getId())
        );
    }
}
