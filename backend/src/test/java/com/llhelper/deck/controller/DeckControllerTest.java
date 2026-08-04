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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.common.model.Language;
import com.llhelper.common.security.JwtService;
import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.response.DeckResponse;
import com.llhelper.deck.service.DeckService;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
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

    private static final Long DECK_ID = 1L;

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private DeckService deckService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private static DeckRequest deckRequest() {
        return new DeckRequest("Deck title", "desc", Language.EN, Language.RU, true);
    }

    private static DeckResponse deckResponse(DeckRequest request) {
        return new DeckResponse(
            DECK_ID, request.title(), request.description(), request.sourceLanguage(),
            request.targetLanguage(), null, null, null, request.isPublic(), List.of()
        );
    }

    // --- create ---

    @Test
    void create_shouldReturn201_whenValid() throws Exception {
        DeckRequest request = deckRequest();
        when(deckService.create(any(DeckRequest.class))).thenReturn(deckResponse(request));

        mockMvc.perform(post("/api/v1/decks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id", is(DECK_ID), Long.class))
            .andExpect(jsonPath("$.title", is(request.title())));
    }

    @Test
    void create_shouldReturn400_whenTitleBlank() throws Exception {
        DeckRequest request = new DeckRequest("", "desc", Language.EN, Language.RU, true);

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

    // --- update ---

    @Test
    void update_shouldReturn403_whenNotOwner() throws Exception {
        DeckRequest request = deckRequest();
        when(deckService.update(eq(DECK_ID), any(DeckRequest.class)))
            .thenThrow(new AccessDeniedException("Access denied: not deck owner"));

        mockMvc.perform(put("/api/v1/decks/{id}", DECK_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message", is("Access denied: not deck owner")));
    }
}
