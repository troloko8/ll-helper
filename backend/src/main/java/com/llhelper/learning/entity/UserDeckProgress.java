package com.llhelper.learning.entity;

import com.llhelper.learning.enums.UserDeckStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_deck_progress")
@Check(constraints = "status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')")
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
