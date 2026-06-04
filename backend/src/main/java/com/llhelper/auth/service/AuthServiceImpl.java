package com.llhelper.auth.service;

import com.llhelper.auth.dto.request.LoginRequest;
import com.llhelper.auth.dto.request.RegisterRequest;
import com.llhelper.auth.dto.response.AuthResponse;
import com.llhelper.auth.entity.AuthUser;
import com.llhelper.auth.repository.AuthRepository;
import com.llhelper.common.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthServiceImpl(AuthRepository authRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        AuthUser authUser = authRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), authUser.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        UserDetails userDetails = toUserDetails(authUser);
        String token = jwtService.generateToken(userDetails);
        return new AuthResponse(token);
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (authRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalStateException("Email already registered");
        }

        AuthUser newUser = new AuthUser();
        newUser.setEmail(request.email());
        newUser.setPasswordHash(passwordEncoder.encode(request.password()));

        AuthUser savedUser = authRepository.save(newUser);

        UserDetails userDetails = toUserDetails(savedUser);
        String token = jwtService.generateToken(userDetails);
        return new AuthResponse(token);
    }

    private UserDetails toUserDetails(AuthUser authUser) {
        return new User(
                authUser.getEmail(),
                authUser.getPasswordHash(),
                Collections.emptyList()
        );
    }
}
