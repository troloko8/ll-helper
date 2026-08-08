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
import com.llhelper.user.dto.request.UpdateUserRequest;
import com.llhelper.user.service.UserService;
import jakarta.persistence.EntityNotFoundException;
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

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    // --- getById ---

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
