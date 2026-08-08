package com.llhelper.card.controller;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.card.dto.request.BulkCardGenerateRequest;
import com.llhelper.card.dto.request.CardRequest;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card.service.CardService;
import com.llhelper.common.security.JwtService;
import java.time.Instant;
import java.util.List;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CardController.class)
@AutoConfigureMockMvc(addFilters = false)
class CardControllerTest {

    private static final Long CARD_ID = 1L;
    private static final Long DECK_ID = 2L;

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private CardService cardService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private static CardRequest cardRequest() {
        return new CardRequest("word", "definition", List.of(), List.of(), "translation", DECK_ID, false);
    }

    private static CardResponse cardResponse(CardRequest request) {
        return new CardResponse(
            CARD_ID, request.deckId(), request.title(), request.definition(),
            request.synonyms(), request.examples(), request.translation(), Instant.EPOCH, Instant.EPOCH
        );
    }

    // --- create ---

    @Test
    void create_shouldReturn201_whenValid() throws Exception {
        CardRequest request = cardRequest();
        when(cardService.create(any(CardRequest.class))).thenReturn(cardResponse(request));

        mockMvc.perform(post("/api/v1/cards")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id", is(CARD_ID), Long.class))
            .andExpect(jsonPath("$.title", is(request.title())));
    }

    @Test
    void create_shouldReturn403_whenNotDeckOwner() throws Exception {
        when(cardService.create(any(CardRequest.class)))
            .thenThrow(new AccessDeniedException("Access denied: not deck owner"));

        mockMvc.perform(post("/api/v1/cards")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cardRequest())))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message", is("Access denied: not deck owner")));
    }

    // --- createBulk ---

    @Test
    void generateBulk_shouldReturn400_whenSizeExceedsLimit() throws Exception {
        List<String> titles = IntStream.range(0, 101).mapToObj(i -> "title" + i).toList();
        BulkCardGenerateRequest request = new BulkCardGenerateRequest(titles, DECK_ID);

        mockMvc.perform(post("/api/v1/cards/bulk-generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.titles").exists());
    }
}
