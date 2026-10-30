package com.llhelper.user.service;

import com.llhelper.auth.entity.AuthUser;
import com.llhelper.auth.repository.AuthRepository;
import com.llhelper.common.security.RateLimitAction;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.common.security.UserRateLimiter;
import com.llhelper.user.dto.request.CreateUserRequest;
import com.llhelper.user.dto.request.UpdateUserRequest;
import com.llhelper.user.dto.response.UserResponse;
import com.llhelper.user.entity.User;
import com.llhelper.user.mapper.UserMapper;
import com.llhelper.user.model.UsernameSlug;
import com.llhelper.user.repository.UserRepository;
import java.util.Objects;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AuthRepository authRepository;
    private final UserMapper userMapper;
    private final SecurityUtils securityUtils;
    private final UserRateLimiter userRateLimiter;

    public UserServiceImpl(
        UserRepository userRepository,
        AuthRepository authRepository,
        UserMapper userMapper,
        SecurityUtils securityUtils,
        UserRateLimiter userRateLimiter
    ) {
        this.userRepository = userRepository;
        this.authRepository = authRepository;
        this.userMapper = userMapper;
        this.securityUtils = securityUtils;
        this.userRateLimiter = userRateLimiter;
    }

    @Override
    public UserResponse getCurrentUser(String email) {
        AuthUser authUser = authRepository.findByEmail(email)
            .orElseThrow(() -> new EntityNotFoundException("AuthUser not found with email: " + email));
        User user = userRepository.findByAuthUserId(authUser.getId())
            .orElseThrow(() -> new EntityNotFoundException("User not found for authUserId: " + authUser.getId()));
        return userMapper.toResponse(user);
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
        return userMapper.toResponse(user);
    }

    @Override
    public UserResponse getUserByUsername(String username) {
        UsernameSlug usernameSlug = UsernameSlug.of(username);
        User user = userRepository.findByUsername(usernameSlug.value())
            .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + usernameSlug.value()));
        return userMapper.toResponse(user);
    }

    @Override
    public UserResponse getUserByAuthUserId(Long authUserId) {
        User user = userRepository.findByAuthUserId(authUserId)
            .orElseThrow(() -> new EntityNotFoundException("User not found with authUserId: " + authUserId));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(String email, CreateUserRequest request) {
        String username = UsernameSlug.fromInput(request.username()).value();
        AuthUser authUser = authRepository.findByEmail(email)
            .orElseThrow(() -> new EntityNotFoundException("AuthUser not found with email: " + email));

        if (userRepository.findByAuthUserId(authUser.getId()).isPresent()) {
            throw new IllegalStateException("User already exists");
        }

        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalStateException("Username already taken: " + username);
        }

        User user = userMapper.toEntity(request);
        user.setUsername(username);
        user.setAuthUser(authUser);

        User saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        String currentUserEmail = securityUtils.getCurrentUserEmail();
        userRateLimiter.checkLimitByEmail(currentUserEmail, RateLimitAction.PROFILE_UPDATE);

        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        validateUserOwnership(user);

        userMapper.updateEntity(request, user);

        User updated = userRepository.save(user);
        return userMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        validateUserOwnership(user);

        userRepository.deleteById(id);
    }

    private void validateUserOwnership(User user) {
        Long currentUserId = securityUtils.getCurrentUserId();
        if (!Objects.equals(user.getId(), currentUserId)) {
            throw new AccessDeniedException("Access denied: not user owner");
        }
    }

}
