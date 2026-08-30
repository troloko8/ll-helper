package com.llhelper.auth.controller;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.auth.dto.request.LoginRequest;
import com.llhelper.auth.dto.request.RegisterRequest;
import com.llhelper.auth.dto.response.AuthResponse;
import com.llhelper.auth.service.AuthService;
import com.llhelper.common.exception.RateLimitExceededException;
import com.llhelper.common.security.JwtService;
import com.llhelper.common.security.RestAuthenticationEntryPoint;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    private static RegisterRequest registerRequest() {
        return new RegisterRequest("user@example.com", "password123");
    }

    private static LoginRequest loginRequest() {
        return new LoginRequest("user@example.com", "password123");
    }

    // --- register ---

    @Test
    void register_shouldReturn200_whenValid() throws Exception {
        when(authService.register(any(RegisterRequest.class))).thenReturn(new AuthResponse("token"));

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken", is("token")));
    }

    @Test
    void register_shouldReturn400_whenEmailInvalid() throws Exception {
        RegisterRequest request = new RegisterRequest("not-an-email", "password123");

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.email").exists());
    }

    // --- login ---

    @Test
    void login_shouldReturn200_whenValid() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(new AuthResponse("token"));

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken", is("token")));
    }

    @Test
    void login_shouldReturn429_whenRateLimitExceeded() throws Exception {
        when(authService.login(any(LoginRequest.class)))
            .thenThrow(new RateLimitExceededException("AUTH_LOGIN rate limit exceeded"));

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest())))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.error", is("RATE_LIMIT_EXCEEDED")))
            .andExpect(jsonPath("$.message", is("AUTH_LOGIN rate limit exceeded")));
    }

    @Test
    void login_shouldReturn401_whenInvalidCredentials() throws Exception {
        when(authService.login(any(LoginRequest.class)))
            .thenThrow(new BadCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest())))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    void register_shouldReturn409_whenEmailAlreadyRegistered() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
            .thenThrow(new IllegalStateException("Email already registered"));

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", is("Email already registered")));
    }
}
