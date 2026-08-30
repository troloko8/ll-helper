package com.llhelper.user.service;

import com.llhelper.user.dto.request.CreateUserRequest;
import com.llhelper.user.dto.request.UpdateUserRequest;
import com.llhelper.user.dto.response.UserResponse;

public interface UserService {
    UserResponse getCurrentUser(String email);
    UserResponse getUserById(Long id);
    UserResponse getUserByUsername(String username);
    UserResponse getUserByAuthUserId(Long authUserId);
    UserResponse createUser(String email, CreateUserRequest request);
    UserResponse updateUser(Long id, UpdateUserRequest request);
    void deleteUser(Long id);
}
