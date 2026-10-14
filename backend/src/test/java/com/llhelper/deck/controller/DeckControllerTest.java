package com.llhelper.deck.controller;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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
import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llhelper.common.model.Language;
import com.llhelper.common.security.JwtService;
import com.llhelper.common.security.RestAuthenticationEntryPoint;
import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.request.PublicDeckQuery;
import com.llhelper.deck.dto.response.DeckDetailsResponse;
import com.llhelper.deck.dto.response.OwnedDeckListResponse;
import com.llhelper.deck.dto.response.PublicDeckPageResponse;
import com.llhelper.deck.dto.response.PublicDeckListResponse;
import com.llhelper.deck.enums.PublicDeckSort;
import com.llhelper.deck.service.DeckService;
import com.llhelper.user.dto.response.UserResponse;
import java.time.Instant;
import java.util.List;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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
    void getById_shouldReturnEnrollmentState_whenDeckExists() throws Exception {
        DeckRequest request = defaultRequest();
        DeckDetailsResponse response = new DeckDetailsResponse(
            DECK_ID,
            request.title(),
            request.description(),
            request.sourceLanguage(),
            request.targetLanguage(),
            Instant.EPOCH,
            Instant.EPOCH,
            null,
            true,
            List.of(),
            true
        );
        when(deckService.getById(DECK_ID)).thenReturn(response);

        mockMvc.perform(get("/api/v1/decks/{id}", DECK_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id", is(DECK_ID), Long.class))
            .andExpect(jsonPath("$.isEnrolled", is(true)));
    }

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

    // --- getPublicDecks ---

    @Test
    void getPublicDecks_shouldReturn200WithPublicDecks() throws Exception {
        DeckRequest request = defaultRequest();
        UserResponse owner = new UserResponse(
            7L,
            "deck-owner",
            "Deck",
            "Owner",
            "EN",
            "RU",
            null,
            "EN",
            Instant.parse("2026-09-20T10:00:00Z"),
            Instant.parse("2026-09-21T10:00:00Z")
        );
        PublicDeckListResponse response = new PublicDeckListResponse(
            DECK_ID,
            request.title(),
            request.sourceLanguage(),
            request.targetLanguage(),
            owner,
            3,
            true
        );
        when(deckService.getPublicDecks(any(PublicDeckQuery.class))).thenReturn(
            new PublicDeckPageResponse(List.of(response), 0, 12, 1, 1, false)
        );

        mockMvc.perform(get("/api/v1/decks")
                .param("q", "deck")
                .param("sourceLanguage", "EN")
                .param("enrolled", "true")
                .param("sort", "CARD_COUNT_DESC"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].id", is(DECK_ID), Long.class))
            .andExpect(jsonPath("$.items[0].title", is(request.title())))
            .andExpect(jsonPath("$.items[0].owner.id", is(7L), Long.class))
            .andExpect(jsonPath("$.items[0].owner.username", is("deck-owner")))
            .andExpect(jsonPath("$.items[0].cardCount", is(3)))
            .andExpect(jsonPath("$.items[0].isEnrolled", is(true)))
            .andExpect(jsonPath("$.items[0].isPublic").doesNotExist())
            .andExpect(jsonPath("$.page", is(0)))
            .andExpect(jsonPath("$.size", is(12)))
            .andExpect(jsonPath("$.totalElements", is(1)))
            .andExpect(jsonPath("$.totalPages", is(1)))
            .andExpect(jsonPath("$.hasNext", is(false)));
    }

    @Test
    void getPublicDecks_shouldBindAllQueryParameters_whenParametersAreProvided() throws Exception {
        when(deckService.getPublicDecks(any(PublicDeckQuery.class))).thenReturn(
            new PublicDeckPageResponse(List.of(), 2, 25, 0, 0, false)
        );

        mockMvc.perform(get("/api/v1/decks")
                .param("q", "deck owner")
                .param("sourceLanguage", "EN")
                .param("targetLanguage", "RU")
                .param("enrolled", "false")
                .param("sort", "TITLE_ASC")
                .param("page", "2")
                .param("size", "25"))
            .andExpect(status().isOk());

        ArgumentCaptor<PublicDeckQuery> queryCaptor = ArgumentCaptor.forClass(PublicDeckQuery.class);
        verify(deckService).getPublicDecks(queryCaptor.capture());
        assertThat(queryCaptor.getValue()).isEqualTo(new PublicDeckQuery(
            "deck owner", Language.EN, Language.RU, false, PublicDeckSort.TITLE_ASC, 2, 25
        ));
    }

    @Test
    void getPublicDecks_shouldApplyDefaultsAndReturnCompleteMetadata_whenParametersAreAbsent() throws Exception {
        when(deckService.getPublicDecks(any(PublicDeckQuery.class))).thenReturn(
            new PublicDeckPageResponse(List.of(), 0, 12, 25, 3, true)
        );

        mockMvc.perform(get("/api/v1/decks"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.items").isEmpty())
            .andExpect(jsonPath("$.page", is(0)))
            .andExpect(jsonPath("$.size", is(12)))
            .andExpect(jsonPath("$.totalElements", is(25)))
            .andExpect(jsonPath("$.totalPages", is(3)))
            .andExpect(jsonPath("$.hasNext", is(true)));

        ArgumentCaptor<PublicDeckQuery> queryCaptor = ArgumentCaptor.forClass(PublicDeckQuery.class);
        verify(deckService).getPublicDecks(queryCaptor.capture());
        assertThat(queryCaptor.getValue()).isEqualTo(new PublicDeckQuery(
            null, null, null, null, PublicDeckSort.NEWEST, 0, 12
        ));
    }

    @Test
    void getPublicDecks_shouldReturn400WithoutCallingService_whenEnumIsInvalid() throws Exception {
        mockMvc.perform(get("/api/v1/decks").param("sort", "POPULAR"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", is("Invalid value for parameter: sort")));

        verify(deckService, never()).getPublicDecks(any(PublicDeckQuery.class));
    }

    @Test
    void getPublicDecks_shouldReturn400WithoutCallingService_whenBooleanIsInvalid() throws Exception {
        mockMvc.perform(get("/api/v1/decks").param("enrolled", "sometimes"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", is("Invalid value for parameter: enrolled")));

        verify(deckService, never()).getPublicDecks(any(PublicDeckQuery.class));
    }

    @Test
    void getPublicDecks_shouldReturn400_whenPageParametersAreInvalid() throws Exception {
        mockMvc.perform(get("/api/v1/decks").param("size", "51"))
            .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/v1/decks").param("page", "-1"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void getPublicDecks_shouldValidateQueryLengthAfterTrimming() throws Exception {
        when(deckService.getPublicDecks(any(PublicDeckQuery.class))).thenReturn(
            new PublicDeckPageResponse(List.of(), 0, 12, 0, 0, false)
        );

        int overLimitLength = PublicDeckQuery.MAX_QUERY_LENGTH + 1;

        mockMvc.perform(get("/api/v1/decks").param("q", "x".repeat(overLimitLength)))
            .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/v1/decks").param("q", " ".repeat(overLimitLength)))
            .andExpect(status().isOk());
    }

    // --- getCurrentUserDecks ---

    @Test
    void getCurrentUserDecks_shouldReturn200WithOwnedPublicAndPrivateDecks() throws Exception {
        DeckRequest request = defaultRequest();
        OwnedDeckListResponse publicDeck = new OwnedDeckListResponse(
            DECK_ID,
            request.title(),
            request.sourceLanguage(),
            request.targetLanguage(),
            true,
            2
        );
        OwnedDeckListResponse privateDeck = new OwnedDeckListResponse(
            2L,
            "Private deck",
            request.sourceLanguage(),
            request.targetLanguage(),
            false,
            0
        );
        when(deckService.getCurrentUserDecks()).thenReturn(List.of(publicDeck, privateDeck));

        mockMvc.perform(get("/api/v1/decks/mine"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id", is(DECK_ID), Long.class))
            .andExpect(jsonPath("$[0].owner").doesNotExist())
            .andExpect(jsonPath("$[0].isPublic", is(true)))
            .andExpect(jsonPath("$[0].cardCount", is(2)))
            .andExpect(jsonPath("$[0].description").doesNotExist())
            .andExpect(jsonPath("$[1].id", is(2L), Long.class))
            .andExpect(jsonPath("$[1].isPublic", is(false)))
            .andExpect(jsonPath("$[1].cardCount", is(0)));
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
