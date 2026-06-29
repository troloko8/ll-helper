package com.llhelper.common.security;

import com.llhelper.auth.entity.AuthUser;
import com.llhelper.auth.repository.AuthRepository;
import com.llhelper.user.entity.User;
import com.llhelper.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    private final AuthRepository authRepository;
    private final UserRepository userRepository;

    public SecurityUtils(AuthRepository authRepository, UserRepository userRepository) {
        this.authRepository = authRepository;
        this.userRepository = userRepository;
    }

    /**
     * Returns the email of the current authenticated user directly from the JWT token.
     * Zero DB queries — use this for rate limiting and other cheap pre-checks.
     */
    public String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("User is not authenticated");
        }

        return authentication.getName();
    }

    /**
     * Returns the current authenticated User.id (not AuthUser.id).
     * TODO: Optimize by adding userId claim to JWT token to avoid DB queries.
     */
    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("User is not authenticated");
        }

        String email = authentication.getName();

        AuthUser authUser = authRepository.findByEmail(email)
            .orElseThrow(() -> new EntityNotFoundException("AuthUser not found: " + email));

        return userRepository.findByAuthUserId(authUser.getId())
            .map(User::getId)
            .orElseThrow(() -> new EntityNotFoundException("User not found for authUserId: " + authUser.getId()));
    }

    /**
     * Returns the current authenticated User entity.
     * TODO: Optimize by caching or adding userId claim to JWT token.
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("User is not authenticated");
        }

        String email = authentication.getName();

        AuthUser authUser = authRepository.findByEmail(email)
            .orElseThrow(() -> new EntityNotFoundException("AuthUser not found: " + email));

        return userRepository.findByAuthUserId(authUser.getId())
            .orElseThrow(() -> new EntityNotFoundException("User not found for authUserId: " + authUser.getId()));
    }
}
