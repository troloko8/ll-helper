package com.llhelper.deck.repository;

import com.llhelper.deck.entity.Deck;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

public interface DeckRepository extends JpaRepository<Deck, Long> {

    @EntityGraph(attributePaths = {"owner"})
    Optional<Deck> findWithOwnerById(Long id);

    @Query(value = """
        select
            d.id as "id",
            d.title as "title",
            d.source_language as "sourceLanguage",
            d.target_language as "targetLanguage",
            u.id as "ownerId",
            u.username as "ownerUsername",
            u.first_name as "ownerFirstName",
            u.last_name as "ownerLastName",
            u.native_language as "ownerNativeLanguage",
            u.target_language as "ownerTargetLanguage",
            u.avatar_url as "ownerAvatarUrl",
            u.ui_language as "ownerUiLanguage",
            u.created_at as "ownerCreatedAt",
            u.updated_at as "ownerUpdatedAt",
            count(c.id) as "cardCount",
            (udp.id is not null) as "isEnrolled"
        from decks d
        join users u on u.id = d.owner_id
        left join cards c on c.deck_id = d.id
        left join user_deck_progress udp
            on udp.deck_id = d.id
            and udp.user_id = :userId
            and udp.status = 'ACTIVE'
        where d.is_public = true
            and (:query is null or lower(d.title) like concat('%', :query, '%') escape '\\'
                or lower(u.username) like concat('%', :query, '%') escape '\\')
            and (:sourceLanguage is null or d.source_language = :sourceLanguage)
            and (:targetLanguage is null or d.target_language = :targetLanguage)
            and (:enrolled is null
                or (:enrolled = true and udp.id is not null)
                or (:enrolled = false and udp.id is null))
        group by d.id, u.id, udp.id
        order by
            case when :sort = 'NEWEST' then d.created_at end desc,
            case when :sort = 'TITLE_ASC' then lower(d.title) end asc,
            case when :sort = 'CARD_COUNT_DESC' then count(c.id) end desc,
            case when :sort = 'TITLE_ASC' then d.id end asc,
            d.id desc
        """, countQuery = """
        select count(*)
        from decks d
        join users u on u.id = d.owner_id
        left join user_deck_progress udp
            on udp.deck_id = d.id
            and udp.user_id = :userId
            and udp.status = 'ACTIVE'
        where d.is_public = true
            and (:query is null or lower(d.title) like concat('%', :query, '%') escape '\\'
                or lower(u.username) like concat('%', :query, '%') escape '\\')
            and (:sourceLanguage is null or d.source_language = :sourceLanguage)
            and (:targetLanguage is null or d.target_language = :targetLanguage)
            and (:enrolled is null
                or (:enrolled = true and udp.id is not null)
                or (:enrolled = false and udp.id is null))
        """, nativeQuery = true)
    Page<PublicDeckListProjection> findPublicDecks(
        @Param("userId") Long userId,
        @Param("query") String query,
        @Param("sourceLanguage") String sourceLanguage,
        @Param("targetLanguage") String targetLanguage,
        @Param("enrolled") Boolean enrolled,
        @Param("sort") String sort,
        Pageable pageable
    );

    @Query(value = """
        select
            d.id as "id",
            d.title as "title",
            d.source_language as "sourceLanguage",
            d.target_language as "targetLanguage",
            u.id as "ownerId",
            u.username as "ownerUsername",
            u.first_name as "ownerFirstName",
            u.last_name as "ownerLastName",
            u.native_language as "ownerNativeLanguage",
            u.target_language as "ownerTargetLanguage",
            u.avatar_url as "ownerAvatarUrl",
            u.ui_language as "ownerUiLanguage",
            u.created_at as "ownerCreatedAt",
            u.updated_at as "ownerUpdatedAt",
            count(c.id) as "cardCount",
            (udp.id is not null) as "isEnrolled"
        from decks d
        join users u on u.id = d.owner_id
        left join cards c on c.deck_id = d.id
        left join user_deck_progress udp
            on udp.deck_id = d.id
            and udp.user_id = :userId
            and udp.status = 'ACTIVE'
        where d.is_public = true
            and u.username = :username
        group by d.id, u.id, udp.id
        order by d.created_at desc, d.id desc
        """, nativeQuery = true)
    List<PublicDeckListProjection> findPublicDecksByOwnerUsername(
        @Param("userId") Long userId,
        @Param("username") String username
    );

    @Query(value = """
        select
            d.id as "id",
            d.title as "title",
            d.source_language as "sourceLanguage",
            d.target_language as "targetLanguage",
            d.is_public as "isPublic",
            count(c.id) as "cardCount"
        from decks d
        left join cards c on c.deck_id = d.id
        where d.owner_id = :ownerId
        group by d.id
        """, nativeQuery = true)
    List<OwnedDeckListProjection> findOwnedDecks(@Param("ownerId") Long ownerId);

    interface PublicDeckListProjection {
        Long getId();
        String getTitle();
        String getSourceLanguage();
        String getTargetLanguage();
        Long getOwnerId();
        String getOwnerUsername();
        String getOwnerFirstName();
        String getOwnerLastName();
        String getOwnerNativeLanguage();
        String getOwnerTargetLanguage();
        String getOwnerAvatarUrl();
        String getOwnerUiLanguage();
        Instant getOwnerCreatedAt();
        Instant getOwnerUpdatedAt();
        Long getCardCount();
        Boolean getIsEnrolled();
    }

    interface OwnedDeckListProjection {
        Long getId();
        String getTitle();
        String getSourceLanguage();
        String getTargetLanguage();
        Boolean getIsPublic();
        Long getCardCount();
    }
}
