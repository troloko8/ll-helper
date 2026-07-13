package com.llhelper.learning.entity;

import com.llhelper.learning.enums.CardLearningStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_card_progress")
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

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;

    @Column(name = "next_review_at")
    private Instant nextReviewAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CardLearningStatus status = CardLearningStatus.NEW;
}
