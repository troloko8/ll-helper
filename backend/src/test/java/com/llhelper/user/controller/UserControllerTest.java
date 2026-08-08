package com.llhelper.user.controller;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.common.security.JwtService;
import com.llhelper.user.dto.request.UpdateUserRequest;
import com.llhelper.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    private static final Long USER_ID = 1L;

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private static UpdateUserRequest updateUserRequest() {
        return new UpdateUserRequest("First", "Last", "en", "ru", null, "en");
    }

    // --- update ---

    @Test
    void update_shouldReturn400_whenFirstNameBlank() throws Exception {
        UpdateUserRequest request = new UpdateUserRequest("", "Last", "en", "ru", null, "en");

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
                .content(objectMapper.writeValueAsString(updateUserRequest())))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message", is("Access denied: not user owner")));
    }
}
