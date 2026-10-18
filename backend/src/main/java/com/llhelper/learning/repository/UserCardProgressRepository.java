package com.llhelper.learning.repository;

import com.llhelper.learning.entity.UserCardProgress;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserCardProgressRepository extends JpaRepository<UserCardProgress, Long> {
    Optional<UserCardProgress> findByUserDeckProgressIdAndCardId(Long userDeckProgressId, Long cardId);

    List<UserCardProgress> findAllByUserDeckProgressId(Long userDeckProgressId);

    @Modifying
    @Query(value = """
        INSERT INTO user_card_progress (
            user_id,
            card_id,
            user_deck_progress_id,
            times_seen,
            times_correct,
            times_wrong,
            correct_streak,
            status
        )
        SELECT
            udp.user_id,
            :cardId,
            udp.id,
            0,
            0,
            0,
            0,
            'NEW'
        FROM user_deck_progress udp
        WHERE udp.deck_id = :deckId
            AND udp.status = 'ACTIVE'
            AND NOT EXISTS (
                SELECT 1
                FROM user_card_progress existing
                WHERE existing.user_deck_progress_id = udp.id
                    AND existing.card_id = :cardId
            )
        ON CONFLICT (user_deck_progress_id, card_id) DO NOTHING
        """, nativeQuery = true)
    int insertMissingForActiveEnrollments(
        @Param("deckId") Long deckId,
        @Param("cardId") Long cardId
    );

    @Query(value = """
        SELECT ucp.*
        FROM user_card_progress ucp
        WHERE ucp.user_deck_progress_id = :userDeckProgressId
            AND ucp.status <> 'MASTERED'
        ORDER BY
            CASE ucp.status
                WHEN 'LEARNING' THEN 0
                WHEN 'REVIEWING' THEN 1
                WHEN 'NEW' THEN 2
                ELSE 3
            END,
            ucp.card_id ASC
        LIMIT 10
        """, nativeQuery = true)
    List<UserCardProgress> findStudyQueue(
        @Param("userDeckProgressId") Long userDeckProgressId
    );
}
