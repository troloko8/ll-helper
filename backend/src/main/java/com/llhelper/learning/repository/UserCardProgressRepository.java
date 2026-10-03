package com.llhelper.learning.repository;

import com.llhelper.learning.entity.UserCardProgress;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserCardProgressRepository extends JpaRepository<UserCardProgress, Long> {
    Optional<UserCardProgress> findByUserDeckProgressIdAndCardId(Long userDeckProgressId, Long cardId);

    List<UserCardProgress> findAllByUserDeckProgressId(Long userDeckProgressId);

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
