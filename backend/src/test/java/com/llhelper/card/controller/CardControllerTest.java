package com.llhelper.card.controller;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static com.llhelper.card.support.CardTestData.CARD_ID;
import static com.llhelper.card.support.CardTestData.bulkGenerateRequest;
import static com.llhelper.card.support.CardTestData.defaultRequest;
import static com.llhelper.card.support.CardTestData.defaultResponse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.ai.exception.AiServiceException;
import com.llhelper.card.dto.request.GenerateCardRequest;
import com.llhelper.card.dto.request.CardRequest;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import com.llhelper.card.dto.request.BulkCardGenerateRequest;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card.service.CardService;
import com.llhelper.common.security.JwtService;
import com.llhelper.common.security.RestAuthenticationEntryPoint;
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

@WebMvcTest({CardController.class, CardGenerationController.class})
@AutoConfigureMockMvc(addFilters = false)
class CardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private CardService cardService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private RestAuthenticationEntryPoint restAuthenticationEntryPoint;


    @Test
    void update_shouldReturn200_whenTranslationPresentAndDefinitionOmitted() throws Exception {
        when(cardService.update(eq(CARD_ID), any()))
            .thenReturn(defaultResponse(CARD_ID, defaultRequest()));
        mockMvc.perform(put("/api/v1/cards/{id}", CARD_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"word","translation":"слово"}
                    """))
            .andExpect(status().isOk());
        verify(cardService).update(CARD_ID,
            new CardRequest("word", null, null, null, "слово"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"null", "\"\"", "\"   \""})
    void update_shouldReturn400_whenTranslationMissingOrBlank(String translation) throws Exception {
        mockMvc.perform(put("/api/v1/cards/{id}", CARD_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"word\",\"definition\":\"meaning\",\"translation\":" + translation + "}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.translation", is("Translation is required")));
        verifyNoInteractions(cardService);
    }

    @Test
    void generate_shouldReturn201_whenOnlyTitleAndDeckProvided() throws Exception {
        var request = new GenerateCardRequest("word", 2L);
        when(cardService.generate(request)).thenReturn(defaultResponse(CARD_ID, defaultRequest()));
        mockMvc.perform(post("/api/v1/card-generations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id", is(CARD_ID), Long.class));
        verify(cardService).generate(request);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "{\"title\":\" \",\"deckId\":2}",
        "{\"title\":\"word\"}",
        "{\"title\":\"word\",\"deckId\":0}"
    })
    void generate_shouldReturn400_whenInputInvalid(String body) throws Exception {
        mockMvc.perform(post("/api/v1/card-generations")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors").exists());
        verifyNoInteractions(cardService);
    }

    @Test
    void generate_shouldReturn503_whenProviderFails() throws Exception {
        when(cardService.generate(any())).thenThrow(new AiServiceException("unavailable"));
        mockMvc.perform(post("/api/v1/card-generations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"word\",\"deckId\":2}"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void generate_shouldReturn403_whenNotOwner() throws Exception {
        when(cardService.generate(any())).thenThrow(new AccessDeniedException("Access denied: not deck owner"));
        mockMvc.perform(post("/api/v1/card-generations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"word\",\"deckId\":2}"))
            .andExpect(status().isForbidden());
    }

    // --- create ---

    @Test
    void create_shouldReturn201_whenValid() throws Exception {
        CardRequest request = defaultRequest();
        when(cardService.create(eq(2L), any(CardRequest.class))).thenReturn(defaultResponse(CARD_ID, request));

        mockMvc.perform(post("/api/v1/decks/{deckId}/cards", 2L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id", is(CARD_ID), Long.class))
            .andExpect(jsonPath("$.title", is(request.title())));
    }

    @Test
    void create_shouldReturn400_whenDeckIdIsNotPositive() throws Exception {
        mockMvc.perform(post("/api/v1/decks/{deckId}/cards", 0L)
            .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(defaultRequest())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.deckId").exists());

        verifyNoInteractions(cardService);
    }

    @ParameterizedTest
    @org.junit.jupiter.params.provider.NullAndEmptySource
    @ValueSource(strings = {"   "})
    void create_shouldReturn400_whenTranslationIsMissingEvenWithDefinition(String translation) throws Exception {
        CardRequest request = new CardRequest(
            "word", "definition", List.of(), List.of(), translation);

        mockMvc.perform(post("/api/v1/decks/{deckId}/cards", 2L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.translation",
                is("Translation is required")));

        verifyNoInteractions(cardService);
    }

    @Test
    void create_shouldReturn201_whenManualCardHasTranslationOnly() throws Exception {
        CardRequest request = new CardRequest(
            "word", null, List.of(), List.of(), "слово");
        when(cardService.create(eq(2L), any(CardRequest.class))).thenReturn(defaultResponse(CARD_ID, request));

        mockMvc.perform(post("/api/v1/decks/{deckId}/cards", 2L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.translation", is("слово")));
    }

    @Test
    void create_shouldReturn403_whenNotDeckOwner() throws Exception {
        when(cardService.create(eq(2L), any(CardRequest.class)))
            .thenThrow(new AccessDeniedException("Access denied: not deck owner"));

        mockMvc.perform(post("/api/v1/decks/{deckId}/cards", 2L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(defaultRequest())))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message", is("Access denied: not deck owner")));
    }

    @Test
    void getById_shouldReturn403_whenPrivateParentDeckIsOwnedByAnotherUser() throws Exception {
        when(cardService.getById(CARD_ID))
            .thenThrow(new AccessDeniedException("Access denied: private deck"));

        mockMvc.perform(get("/api/v1/cards/{id}", CARD_ID))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message", is("Access denied: private deck")));
    }

    // --- getPublicCards ---

    @Test
    void getPublicCards_shouldReturnSafe500_whenUnexpectedExceptionContainsInternalDetails() throws Exception {
        when(cardService.getPublicCards()).thenThrow(
            new RuntimeException("SQL failed on internal_cards: password=secret",
                new RuntimeException("Internal database connection details")));

        mockMvc.perform(get("/api/v1/cards"))
            .andExpect(status().isInternalServerError())
            .andExpect(content().string("{\"message\":\"Internal server error\"}"));
    }

    @Test
    void getPublicCards_shouldReturnSafe500_whenUnexpectedExceptionHasNoMessage() throws Exception {
        when(cardService.getPublicCards()).thenThrow(new RuntimeException());

        mockMvc.perform(get("/api/v1/cards"))
            .andExpect(status().isInternalServerError())
            .andExpect(content().string("{\"message\":\"Internal server error\"}"));
    }

    @Test
    void getPublicCards_shouldReturn200WithPublicCards() throws Exception {
        CardResponse response = defaultResponse(CARD_ID);
        when(cardService.getPublicCards()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/cards"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id", is(CARD_ID), Long.class))
            .andExpect(jsonPath("$[0].deckId", is(response.deckId()), Long.class))
            .andExpect(jsonPath("$[0].title", is(response.title())));
    }

    // --- createBulk ---

    @Test
    void generateBulk_shouldReturn400_whenSizeExceedsLimit() throws Exception {
        BulkCardGenerateRequest request = bulkGenerateRequest(101);

        mockMvc.perform(post("/api/v1/card-generations/bulk")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.titles").exists());
    }
}
