package com.llhelper.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Single security-boundary mechanism for writing the generic 401 body.
 * Used both as the Spring Security {@link AuthenticationEntryPoint} (missing/invalid
 * Bearer token reaching the filter chain) and directly by {@link JwtAuthenticationFilter}
 * when JWT parsing/validation fails, so the JSON error body is never duplicated.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"Authentication required\"}");
    }
}
