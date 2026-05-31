package com.llhelper.learning.repository;

import com.llhelper.learning.entity.UserCardProgress;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserCardProgressRepository extends JpaRepository<UserCardProgress, Long> {

    Optional<UserCardProgress> findByUserIdAndCardId(Long userId, Long cardId);

    List<UserCardProgress> findAllByUserDeckProgressId(Long userDeckProgressId);
}
