package com.llhelper.learning.entity;

import com.llhelper.learning.enums.CardLearningStatus;
import jakarta.persistence.CheckConstraint;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
    name = "user_card_progress",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_user_card_progress_deck_card",
        columnNames = {"user_deck_progress_id", "card_id"}
    ),
    indexes = {
        @Index(name = "idx_ucp_user_deck", columnList = "user_deck_progress_id, status")
    },
    check = @CheckConstraint(constraint = "status IN ('NEW', 'LEARNING', 'REVIEWING', 'MASTERED')")
)
public class UserCardProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long cardId;

    @Column(nullable = false)
    private Long userDeckProgressId;

    @Column(nullable = false)
    private Integer timesSeen = 0;

    @Column(nullable = false)
    private Integer timesCorrect = 0;

    @Column(nullable = false)
    private Integer timesWrong = 0;

    @Column(nullable = false)
    private Integer correctStreak = 0;

    private Integer difficultyLevel;

    private LocalDateTime lastReviewedAt;

    private LocalDateTime nextReviewAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CardLearningStatus status = CardLearningStatus.NEW;
}
