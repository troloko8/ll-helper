package com.llhelper.learning.repository;

import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.UserDeckStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserDeckProgressRepository extends JpaRepository<UserDeckProgress, Long> {

    interface LearningDeckSummaryProjection {
        Long getDeckId();
        String getTitle();
        // TODO: Verify typed Language mapping for PostgreSQL enum columns in native
        // Spring Data projections. The database already stores these as language_enum,
        // so this should require ORM/JDBC mapping changes, not a schema migration.
        // If supported, return Language here and in DeckRepository projections, then
        // remove the String-to-Language converters from the MapStruct mappers.
        String getSourceLanguage();
        String getTargetLanguage();
        Instant getEnrolledAt();
        Instant getLastStudiedAt();
        Long getMasteredCount();
        Long getTotalCount();
    }

    Optional<UserDeckProgress> findByUserIdAndDeckId(Long userId, Long deckId);

    Optional<UserDeckProgress> findByUserIdAndDeckIdAndStatus(
        Long userId,
        Long deckId,
        UserDeckStatus status
    );

    boolean existsByUserIdAndDeckId(Long userId, Long deckId);

    @Query(value = """
        SELECT
            udp.deck_id AS "deckId",
            d.title AS "title",
            d.source_language AS "sourceLanguage",
            d.target_language AS "targetLanguage",
            udp.enrolled_at AS "enrolledAt",
            udp.last_studied_at AS "lastStudiedAt",
            COUNT(*) FILTER (WHERE ucp.status = 'MASTERED') AS "masteredCount",
            COUNT(ucp.user_deck_progress_id) AS "totalCount"
        FROM user_deck_progress udp
        JOIN decks d
            ON d.id = udp.deck_id
        LEFT JOIN user_card_progress ucp
            ON ucp.user_deck_progress_id = udp.id
        WHERE udp.user_id = :userId
            AND udp.status = 'ACTIVE'
        GROUP BY udp.id, d.id
        ORDER BY
            udp.last_studied_at DESC NULLS LAST,
            CASE
                WHEN udp.last_studied_at IS NULL
                THEN udp.enrolled_at
            END DESC,
            udp.id ASC
        """, nativeQuery = true)
    List<LearningDeckSummaryProjection> findLearningDeckSummaries(@Param("userId") Long userId);
}
