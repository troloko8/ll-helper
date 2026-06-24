package com.llhelper.user.service;

import com.llhelper.auth.entity.AuthUser;
import com.llhelper.auth.repository.AuthRepository;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.user.dto.request.CreateUserRequest;
import com.llhelper.user.dto.request.UpdateUserRequest;
import com.llhelper.user.dto.response.UserResponse;
import com.llhelper.user.entity.User;
import com.llhelper.user.mapper.UserMapper;
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

    public UserServiceImpl(
        UserRepository userRepository,
        AuthRepository authRepository,
        UserMapper userMapper,
        SecurityUtils securityUtils
    ) {
        this.userRepository = userRepository;
        this.authRepository = authRepository;
        this.userMapper = userMapper;
        this.securityUtils = securityUtils;
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
        return userMapper.toResponse(user);
    }

    @Override
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));
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
        AuthUser authUser = authRepository.findByEmail(email)
            .orElseThrow(() -> new EntityNotFoundException("AuthUser not found with email: " + email));

        if (userRepository.findByUsername(request.username()).isPresent()) {
            throw new IllegalStateException("Username already taken: " + request.username());
        }

        User user = new User();
        user.setAuthUser(authUser);
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setUsername(request.username());
        user.setNativeLanguage(request.nativeLanguage());
        user.setTargetLanguage(request.targetLanguage());
        user.setAvatarUrl(request.avatarUrl());
        user.setUiLanguage(request.uiLanguage());

        User saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
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
