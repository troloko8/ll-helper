package com.llhelper.card.repository;

import com.llhelper.card.entity.Card;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CardRepository extends JpaRepository<Card, Long> {
    @Query(value = """
        SELECT c.*
        FROM cards c
        JOIN decks d ON d.id = c.deck_id
        WHERE c.id = :id
            AND c.deleted_at IS NULL
            AND d.deleted_at IS NULL
        """, nativeQuery = true)
    @Override
    Optional<Card> findById(@Param("id") Long id);

    @Query(value = """
        SELECT c.*
        FROM cards c
        JOIN decks d ON d.id = c.deck_id
        WHERE c.id = :id
            AND c.deleted_at IS NULL
            AND d.deleted_at IS NULL
        FOR UPDATE OF c
        """, nativeQuery = true)
    Optional<Card> findActiveByIdForUpdate(@Param("id") Long id);

    @Query(value = """
        SELECT c.*
        FROM cards c
        JOIN decks d ON d.id = c.deck_id
        WHERE c.id IN (:ids)
            AND c.deleted_at IS NULL
            AND d.deleted_at IS NULL
        """, nativeQuery = true)
    @Override
    List<Card> findAllById(@Param("ids") Iterable<Long> ids);

    @Query(value = """
        SELECT c.*
        FROM cards c
        JOIN decks d ON d.id = c.deck_id
        WHERE c.deleted_at IS NULL
            AND d.deleted_at IS NULL
            AND d.is_public = true
        """, nativeQuery = true)
    List<Card> findAllByDeckIsPublicTrue();
}
