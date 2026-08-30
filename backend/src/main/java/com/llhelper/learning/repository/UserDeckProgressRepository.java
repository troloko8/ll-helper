package com.llhelper.learning.repository;

import com.llhelper.learning.entity.UserDeckProgress;
import com.llhelper.learning.enums.UserDeckStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDeckProgressRepository extends JpaRepository<UserDeckProgress, Long> {

    Optional<UserDeckProgress> findByUserIdAndDeckId(Long userId, Long deckId);

    boolean existsByUserIdAndDeckId(Long userId, Long deckId);

    List<UserDeckProgress> findAllByUserIdAndStatus(Long userId, UserDeckStatus status);
}
