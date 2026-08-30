package com.llhelper.user.controller;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static com.llhelper.user.support.UserTestData.USER_ID;
import static com.llhelper.user.support.UserTestData.blankFirstNameUpdateRequest;
import static com.llhelper.user.support.UserTestData.defaultUpdateRequest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.common.security.JwtService;
import com.llhelper.common.security.RestAuthenticationEntryPoint;
import com.llhelper.user.dto.request.UpdateUserRequest;
import com.llhelper.user.dto.response.UserResponse;
import com.llhelper.user.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    private static final String USER_EMAIL = "user@example.com";

    private static UsernamePasswordAuthenticationToken authentication() {
        UserDetails userDetails = new User(USER_EMAIL, "password", List.of());
        return new UsernamePasswordAuthenticationToken(userDetails, null, List.of());
    }

    // --- getById ---

    @Test
    void getCurrentUser_shouldReturn200_whenProfileExists() throws Exception {
        UserResponse response = new UserResponse(
            USER_ID, "username", "First", "Last", "en", "ru", null, "en", null, null
        );
        when(userService.getCurrentUser(USER_EMAIL)).thenReturn(response);

        mockMvc.perform(get("/api/v1/users/me").principal(authentication()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id", is(USER_ID.intValue())))
            .andExpect(jsonPath("$.username", is("username")))
            .andExpect(jsonPath("$.firstName", is("First")))
            .andExpect(jsonPath("$.lastName", is("Last")))
            .andExpect(jsonPath("$.nativeLanguage", is("en")))
            .andExpect(jsonPath("$.targetLanguage", is("ru")))
            .andExpect(jsonPath("$.avatarUrl").doesNotExist())
            .andExpect(jsonPath("$.uiLanguage", is("en")));
    }

    @Test
    void getCurrentUser_shouldReturn404_whenProfileDoesNotExist() throws Exception {
        String message = "User not found for authUserId: 2";
        when(userService.getCurrentUser(USER_EMAIL)).thenThrow(new EntityNotFoundException(message));

        mockMvc.perform(get("/api/v1/users/me").principal(authentication()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", is(message)));
    }

    @Test
    void getById_shouldReturn404_whenUserNotFound() throws Exception {
        when(userService.getUserById(USER_ID))
            .thenThrow(new EntityNotFoundException("User not found with id: " + USER_ID));

        mockMvc.perform(get("/api/v1/users/{id}", USER_ID))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", is("User not found with id: " + USER_ID)));
    }

    // --- update ---

    @Test
    void update_shouldReturn400_whenFirstNameBlank() throws Exception {
        UpdateUserRequest request = blankFirstNameUpdateRequest();

        mockMvc.perform(put("/api/v1/users/{id}", USER_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.firstName").exists());
    }

    @Test
    void update_shouldReturn403_whenNotSelf() throws Exception {
        when(userService.updateUser(eq(USER_ID), any(UpdateUserRequest.class)))
            .thenThrow(new AccessDeniedException("Access denied: not user owner"));

        mockMvc.perform(put("/api/v1/users/{id}", USER_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(defaultUpdateRequest())))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message", is("Access denied: not user owner")));
    }
}
