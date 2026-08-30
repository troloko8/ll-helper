package com.llhelper.common.security;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.llhelper.user.controller.UserController;
import com.llhelper.user.dto.response.UserResponse;
import com.llhelper.user.service.UserService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Focused security/filter-chain test: exercises the real {@code SecurityFilterChain}
 * (JwtAuthenticationFilter + SecurityConfig + RestAuthenticationEntryPoint) against a
 * protected endpoint, unlike the controller slice tests which run with
 * {@code addFilters = false}.
 */
@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, JwtSecurityFilterChainTest.SecurityBeansConfig.class})
@TestPropertySource(properties = {
        "jwt.secret=test-secret-key-for-jwt-filter-chain-tests-32-chars-min",
        "jwt.expiration=86400000"
})
class JwtSecurityFilterChainTest {

    private static final String USER_EMAIL = "user@example.com";
    private static final SecretKey SIGNING_KEY =
            Keys.hmacShaKeyFor("test-secret-key-for-jwt-filter-chain-tests-32-chars-min".getBytes());
    private static final String EXPECTED_BODY = "{\"message\":\"Authentication required\"}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Test
    void getCurrentUser_shouldReturn401_whenNoAuthorizationHeader() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(content().json(EXPECTED_BODY));
    }

    @Test
    void getCurrentUser_shouldReturn401_whenBearerTokenIsMalformed() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer not-a-jwt"))
            .andExpect(status().isUnauthorized())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(content().json(EXPECTED_BODY));
    }

    @Test
    void getCurrentUser_shouldReturn401_whenJwtIsExpired() throws Exception {
        String expiredToken = Jwts.builder()
                .subject(USER_EMAIL)
                .issuedAt(Date.from(Instant.now().minusSeconds(7200)))
                .expiration(Date.from(Instant.now().minusSeconds(3600)))
                .signWith(SIGNING_KEY)
                .compact();

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + expiredToken))
            .andExpect(status().isUnauthorized())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(content().json(EXPECTED_BODY));
    }

    @Test
    void getCurrentUser_shouldReturn401_whenJwtHasInvalidSignature() throws Exception {
        SecretKey wrongKey = Keys.hmacShaKeyFor(
                "a-completely-different-signing-key-32-chars-min".getBytes());
        String tokenSignedWithWrongKey = Jwts.builder()
                .subject(USER_EMAIL)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(wrongKey)
                .compact();

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + tokenSignedWithWrongKey))
            .andExpect(status().isUnauthorized())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(content().json(EXPECTED_BODY));
    }

    @Test
    void getCurrentUser_shouldPassThrough_whenJwtIsValid() throws Exception {
        UserDetails userDetails = new User(USER_EMAIL, "password", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        when(userDetailsService.loadUserByUsername(USER_EMAIL)).thenReturn(userDetails);
        when(userService.getCurrentUser(USER_EMAIL)).thenReturn(
                new UserResponse(1L, USER_EMAIL, "Test", "User", "en", "en", null, "en", null, null));

        String validToken = Jwts.builder()
                .subject(USER_EMAIL)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(SIGNING_KEY)
                .compact();

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + validToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value(USER_EMAIL));
    }

    @TestConfiguration
    static class SecurityBeansConfig {
        @Bean
        RestAuthenticationEntryPoint restAuthenticationEntryPoint() {
            return new RestAuthenticationEntryPoint();
        }

        @Bean
        JwtService jwtService() {
            return new JwtService();
        }

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter(
                JwtService jwtService,
                UserDetailsService userDetailsService,
                RestAuthenticationEntryPoint restAuthenticationEntryPoint
        ) {
            return new JwtAuthenticationFilter(jwtService, userDetailsService, restAuthenticationEntryPoint);
        }
    }
}
