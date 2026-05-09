package com.llhelper.user.repository;

import java.util.Optional;

import com.llhelper.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByAuthUserId(Long authUserId);
}
