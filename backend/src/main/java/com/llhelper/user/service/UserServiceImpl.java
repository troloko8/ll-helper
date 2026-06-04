package com.llhelper.user.service;

import com.llhelper.auth.entity.AuthUser;
import com.llhelper.auth.repository.AuthRepository;
import com.llhelper.user.dto.request.CreateUserRequest;
import com.llhelper.user.dto.request.UpdateUserRequest;
import com.llhelper.user.dto.response.UserResponse;
import com.llhelper.user.entity.User;
import com.llhelper.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AuthRepository authRepository;

    public UserServiceImpl(UserRepository userRepository, AuthRepository authRepository) {
        this.userRepository = userRepository;
        this.authRepository = authRepository;
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
        return toResponse(user);
    }

    @Override
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));
        return toResponse(user);
    }

    @Override
    public UserResponse getUserByAuthUserId(Long authUserId) {
        User user = userRepository.findByAuthUserId(authUserId)
            .orElseThrow(() -> new EntityNotFoundException("User not found with authUserId: " + authUserId));
        return toResponse(user);
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
        return toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setNativeLanguage(request.nativeLanguage());
        user.setTargetLanguage(request.targetLanguage());
        user.setAvatarUrl(request.avatarUrl());
        user.setUiLanguage(request.uiLanguage());

        User updated = userRepository.save(user);
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getFirstName(),
            user.getLastName(),
            user.getNativeLanguage(),
            user.getTargetLanguage(),
            user.getAvatarUrl(),
            user.getUiLanguage(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
