package com.llhelper.auth.service;

import com.llhelper.auth.dto.request.LoginRequest;
import com.llhelper.auth.dto.response.AuthResponse;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    @Override
    public AuthResponse login(LoginRequest request) {
        return new AuthResponse("stub-token");
    }
}
