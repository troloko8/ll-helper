package com.llhelper.deck.controller;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static com.llhelper.deck.support.DeckTestData.DECK_ID;
import static com.llhelper.deck.support.DeckTestData.blankTitleRequest;
import static com.llhelper.deck.support.DeckTestData.defaultRequest;
import static com.llhelper.deck.support.DeckTestData.defaultResponse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.common.security.JwtService;
import com.llhelper.common.security.RestAuthenticationEntryPoint;
import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.service.DeckService;
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

@WebMvcTest(DeckController.class)
@AutoConfigureMockMvc(addFilters = false)
class DeckControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private DeckService deckService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    // --- create ---

    @Test
    void create_shouldReturn201_whenValid() throws Exception {
        DeckRequest request = defaultRequest();
        when(deckService.create(any(DeckRequest.class))).thenReturn(defaultResponse(DECK_ID, request));

        mockMvc.perform(post("/api/v1/decks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id", is(DECK_ID), Long.class))
            .andExpect(jsonPath("$.title", is(request.title())));
    }

    @Test
    void create_shouldReturn400_whenTitleBlank() throws Exception {
        DeckRequest request = blankTitleRequest();

        mockMvc.perform(post("/api/v1/decks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.title").exists());
    }

    // --- getById ---

    @Test
    void getById_shouldReturn404_whenDeckNotFound() throws Exception {
        when(deckService.getById(DECK_ID))
            .thenThrow(new EntityNotFoundException("Deck not found: " + DECK_ID));

        mockMvc.perform(get("/api/v1/decks/{id}", DECK_ID))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", is("Deck not found: " + DECK_ID)));
    }

    @Test
    void getById_shouldReturn403_whenPrivateDeckIsOwnedByAnotherUser() throws Exception {
        when(deckService.getById(DECK_ID))
            .thenThrow(new AccessDeniedException("Access denied: private deck"));

        mockMvc.perform(get("/api/v1/decks/{id}", DECK_ID))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message", is("Access denied: private deck")));
    }

    // --- update ---

    @Test
    void update_shouldReturn403_whenNotOwner() throws Exception {
        DeckRequest request = defaultRequest();
        when(deckService.update(eq(DECK_ID), any(DeckRequest.class)))
            .thenThrow(new AccessDeniedException("Access denied: not deck owner"));

        mockMvc.perform(put("/api/v1/decks/{id}", DECK_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message", is("Access denied: not deck owner")));
    }
}
