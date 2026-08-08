package com.llhelper.learning.controller;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static com.llhelper.learning.support.LearningTestData.defaultCardReviewRequest;
import static com.llhelper.learning.support.LearningTestData.defaultCardReviewResponse;
import static com.llhelper.learning.support.LearningTestData.defaultEnrollResponse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.learning.dto.request.CardReviewRequest;
import com.llhelper.learning.dto.response.CardReviewResponse;
import com.llhelper.learning.service.LearningService;
import com.llhelper.common.security.JwtService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(LearningController.class)
@AutoConfigureMockMvc(addFilters = false)
class LearningControllerTest {

    private static final Long DECK_ID = 1L;
    private static final Long USER_DECK_PROGRESS_ID = 10L;
    private static final Long CARD_ID = 3L;

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private LearningService learningService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    // --- enrollDeck ---

    @Test
    void enroll_shouldReturn201_whenSuccess() throws Exception {
        when(learningService.enrollDeck(DECK_ID)).thenReturn(defaultEnrollResponse());

        mockMvc.perform(post("/api/v1/decks/{deckId}/enroll", DECK_ID))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.userDeckId", is(USER_DECK_PROGRESS_ID), Long.class));
    }

    @Test
    void enroll_shouldReturn404_whenDeckNotFound() throws Exception {
        when(learningService.enrollDeck(DECK_ID))
            .thenThrow(new EntityNotFoundException("Deck not found: " + DECK_ID));

        mockMvc.perform(post("/api/v1/decks/{deckId}/enroll", DECK_ID))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", is("Deck not found: " + DECK_ID)));
    }

    @Test
    void enroll_shouldReturn409_whenAlreadyEnrolled() throws Exception {
        when(learningService.enrollDeck(DECK_ID))
            .thenThrow(new IllegalStateException("Deck already enrolled"));

        mockMvc.perform(post("/api/v1/decks/{deckId}/enroll", DECK_ID))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", is("Deck already enrolled")));
    }

    // --- reviewCard ---

    @Test
    void review_shouldReturn200_whenSuccess() throws Exception {
        CardReviewRequest request = defaultCardReviewRequest();
        CardReviewResponse response = defaultCardReviewResponse();
        when(learningService.reviewCard(eq(CARD_ID), any(CardReviewRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/cards/{cardId}/review", CARD_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.correct", is(true)))
            .andExpect(jsonPath("$.correctAnswer", is("hello")))
            .andExpect(jsonPath("$.status", is("LEARNING")))
            .andExpect(jsonPath("$.correctStreak", is(1)))
            .andExpect(jsonPath("$.totalCorrect", is(1)));
    }

    @Test
    void review_shouldReturn404_whenProgressNotFound() throws Exception {
        CardReviewRequest request = defaultCardReviewRequest();
        when(learningService.reviewCard(eq(CARD_ID), any(CardReviewRequest.class)))
            .thenThrow(new EntityNotFoundException("Card progress not found: " + CARD_ID));

        mockMvc.perform(post("/api/v1/cards/{cardId}/review", CARD_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message", is("Card progress not found: " + CARD_ID)));
    }
}
