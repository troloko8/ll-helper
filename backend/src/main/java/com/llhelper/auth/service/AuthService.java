package com.llhelper.auth.service;

import com.llhelper.auth.dto.request.LoginRequest;
import com.llhelper.auth.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
}
