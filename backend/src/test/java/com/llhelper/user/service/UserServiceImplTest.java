package com.llhelper.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.llhelper.auth.repository.AuthRepository;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.common.security.UserRateLimiter;
import com.llhelper.user.dto.request.UpdateUserRequest;
import com.llhelper.user.dto.response.UserResponse;
import com.llhelper.user.entity.User;
import com.llhelper.user.mapper.UserMapper;
import com.llhelper.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    private static final Long SELF_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthRepository authRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private SecurityUtils securityUtils;

    @Mock
    private UserRateLimiter userRateLimiter;

    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(userRepository, authRepository, userMapper, securityUtils, userRateLimiter);
    }

    private static User userWithId(Long id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private static UpdateUserRequest updateUserRequest() {
        return new UpdateUserRequest("First", "Last", "en", "ru", null, "en");
    }

    @Test
    void update_shouldThrowForbidden_whenUserIsNotSelf() {
        User user = userWithId(SELF_ID);
        when(securityUtils.getCurrentUserEmail()).thenReturn("attacker@example.com");
        when(userRepository.findById(SELF_ID)).thenReturn(Optional.of(user));
        when(securityUtils.getCurrentUserId()).thenReturn(OTHER_USER_ID);

        assertThatThrownBy(() -> userService.updateUser(SELF_ID, updateUserRequest()))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessageContaining("not user owner");

        verify(userRepository, never()).save(user);
    }

    @Test
    void delete_shouldThrowForbidden_whenUserIsNotSelf() {
        User user = userWithId(SELF_ID);
        when(userRepository.findById(SELF_ID)).thenReturn(Optional.of(user));
        when(securityUtils.getCurrentUserId()).thenReturn(OTHER_USER_ID);

        assertThatThrownBy(() -> userService.deleteUser(SELF_ID))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessageContaining("not user owner");

        verify(userRepository, never()).deleteById(SELF_ID);
    }

    @Test
    void update_shouldSucceed_whenUserIsSelf() {
        User user = userWithId(SELF_ID);
        UpdateUserRequest request = updateUserRequest();
        UserResponse response = new UserResponse(
            SELF_ID, "username", request.firstName(), request.lastName(),
            request.nativeLanguage(), request.targetLanguage(), request.avatarUrl(), request.uiLanguage(), null, null
        );
        when(securityUtils.getCurrentUserEmail()).thenReturn("self@example.com");
        when(userRepository.findById(SELF_ID)).thenReturn(Optional.of(user));
        when(securityUtils.getCurrentUserId()).thenReturn(SELF_ID);
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toResponse(user)).thenReturn(response);

        UserResponse result = userService.updateUser(SELF_ID, request);

        assertThat(result).isEqualTo(response);
        verify(userMapper).updateEntity(request, user);
        verify(userRepository).save(user);
    }

    @Test
    void delete_shouldSucceed_whenUserIsSelf() {
        User user = userWithId(SELF_ID);
        when(userRepository.findById(SELF_ID)).thenReturn(Optional.of(user));
        when(securityUtils.getCurrentUserId()).thenReturn(SELF_ID);

        userService.deleteUser(SELF_ID);

        verify(userRepository).deleteById(SELF_ID);
    }
}
