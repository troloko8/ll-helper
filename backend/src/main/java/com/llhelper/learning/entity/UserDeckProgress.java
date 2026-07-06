package com.llhelper.learning.entity;

import com.llhelper.learning.enums.UserDeckStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_deck_progress")
public class UserDeckProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long deckId;

    private LocalDateTime lastStudiedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserDeckStatus status = UserDeckStatus.ACTIVE;
}
