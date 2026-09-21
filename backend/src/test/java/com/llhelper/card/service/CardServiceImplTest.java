package com.llhelper.card.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.llhelper.ai.config.AiProperties;
import com.llhelper.ai.dto.AiCardData;
import com.llhelper.ai.exception.AiServiceException;
import com.llhelper.ai.service.AiCardGenerationService;
import com.llhelper.card.dto.request.BulkCardGenerateRequest;
import com.llhelper.card.dto.request.CardRequest;
import com.llhelper.card.dto.request.GenerateCardRequest;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card.entity.Card;
import com.llhelper.card.mapper.CardMapper;
import com.llhelper.card.repository.CardRepository;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.common.security.UserRateLimiter;
import com.llhelper.deck.entity.Deck;
import com.llhelper.deck.repository.DeckRepository;
import com.llhelper.deck.access.DeckAccessPolicy;
import com.llhelper.user.entity.User;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mapstruct.factory.Mappers;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CardServiceImplTest {

    private static final Long OWNER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;
    private static final Long DECK_ID = 10L;
    private static final Long CARD_ID = 20L;

    @Mock
    private CardRepository cardRepository;

    @Mock
    private DeckRepository deckRepository;

    @Mock
    private AiCardGenerationService aiCardGenerationService;

    @Mock
    private SecurityUtils securityUtils;

    @Mock
    private CardMapper cardMapper;

    @Mock
    private UserRateLimiter userRateLimiter;

    @Mock
    private EntityManager entityManager;

    private AiProperties aiProperties;

    private CardServiceImpl cardService;

    @BeforeEach
    void setUp() {
        aiProperties = new AiProperties();
        cardService = new CardServiceImpl(
            cardRepository,
            deckRepository,
            aiCardGenerationService,
            securityUtils,
            cardMapper,
            userRateLimiter,
            aiProperties,
            new DeckAccessPolicy(securityUtils)
        );
        ReflectionTestUtils.setField(cardService, "entityManager", entityManager);
    }

    private static Deck deckOwnedBy(Long ownerId) {
        User owner = new User();
        owner.setId(ownerId);

        Deck deck = new Deck();
        deck.setId(DECK_ID);
        deck.setOwner(owner);
        return deck;
    }

    private static CardRequest cardRequest() {
        return new CardRequest("title", "def", List.of(), List.of(), "translation");
    }

    private static Card card() {
        Card card = new Card();
        card.setId(CARD_ID);
        card.setDeckId(DECK_ID);
        card.setTitle("title");
        return card;
    }

    private static CardResponse cardResponse() {
        return new CardResponse(CARD_ID, DECK_ID, "title", "def", List.of(), List.of(), "translation", null, null);
    }


    @Test
    void generate_shouldSaveGeneratedContent_whenUserIsOwner() {
        Deck deck = deckOwnedBy(OWNER_ID);
        var request = new GenerateCardRequest("word", DECK_ID);
        var aiData = new AiCardData(null, List.of(), List.of(), " перевод ");
        Card generated = new Card();
        generated.setTranslation(aiData.translation());
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(aiCardGenerationService.generateCardData("word", deck.getSourceLanguage(), deck.getTargetLanguage()))
            .thenReturn(aiData);
        when(cardMapper.fromAiData("word", aiData, deck)).thenReturn(generated);
        when(cardRepository.saveAndFlush(generated)).thenReturn(generated);
        when(cardMapper.toResponse(generated)).thenReturn(cardResponse());

        assertThat(cardService.generate(request)).isEqualTo(cardResponse());
        assertThat(generated.getTranslation()).isEqualTo("перевод");
        assertThat(generated.getDefinition()).isNull();
        verify(cardRepository).saveAndFlush(generated);
    }

    @Test
    void generate_shouldRejectNonOwner_beforeCallingAi() {
        when(securityUtils.getCurrentUserId()).thenReturn(OTHER_USER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deckOwnedBy(OWNER_ID)));
        assertThatThrownBy(() -> cardService.generate(new GenerateCardRequest("word", DECK_ID)))
            .isInstanceOf(AccessDeniedException.class);
        verify(aiCardGenerationService, never()).generateCardData(any(), any(), any());
        verify(cardRepository, never()).saveAndFlush(any());
    }

    @Test
    void update_shouldClearOptionalContentAndKeepDeck_whenReplacingCard() {
        Card existing = card();
        existing.setDefinition("old definition");
        existing.setExamples(List.of("old example"));
        existing.setSynonyms(List.of("old synonym"));
        existing.setTranslation("old translation");
        var request = new CardRequest("new title", null, null, null, " new translation ");
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(cardRepository.findById(CARD_ID)).thenReturn(Optional.of(existing));
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deckOwnedBy(OWNER_ID)));
        doAnswer(invocation -> {
            Mappers.getMapper(CardMapper.class).updateEntity(request, existing);
            return null;
        }).when(cardMapper).updateEntity(request, existing);
        when(cardRepository.saveAndFlush(existing)).thenReturn(existing);

        cardService.update(CARD_ID, request);

        assertThat(existing.getTitle()).isEqualTo("new title");
        assertThat(existing.getTranslation()).isEqualTo("new translation");
        assertThat(existing.getDefinition()).isNull();
        assertThat(existing.getExamples()).isNull();
        assertThat(existing.getSynonyms()).isNull();
        assertThat(existing.getDeckId()).isEqualTo(DECK_ID);
        verify(cardRepository).saveAndFlush(existing);
        verify(aiCardGenerationService, never()).generateCardData(any(), any(), any());
    }

    @Test
    void update_shouldRejectNonOwner_withoutSaving() {
        when(securityUtils.getCurrentUserId()).thenReturn(OTHER_USER_ID);
        when(cardRepository.findById(CARD_ID)).thenReturn(Optional.of(card()));
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deckOwnedBy(OWNER_ID)));
        assertThatThrownBy(() -> cardService.update(CARD_ID,
            new CardRequest("word", null, null, null, "translation")))
            .isInstanceOf(AccessDeniedException.class);
        verify(cardMapper, never()).updateEntity(any(), any());
        verify(cardRepository, never()).saveAndFlush(any());
    }

    @Test
    void getById_shouldSucceed_whenParentDeckIsPublic() {
        Card card = card();
        Deck deck = deckOwnedBy(OWNER_ID);
        CardResponse response = cardResponse();
        when(cardRepository.findById(CARD_ID)).thenReturn(Optional.of(card));
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(cardMapper.toResponse(card)).thenReturn(response);

        CardResponse result = cardService.getById(CARD_ID);

        assertThat(result).isEqualTo(response);
        verify(cardMapper).toResponse(card);
    }

    @Test
    void getById_shouldSucceed_whenPrivateParentDeckIsOwnedByCurrentUser() {
        Card card = card();
        Deck deck = deckOwnedBy(OWNER_ID);
        deck.setIsPublic(false);
        CardResponse response = cardResponse();
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(cardRepository.findById(CARD_ID)).thenReturn(Optional.of(card));
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(cardMapper.toResponse(card)).thenReturn(response);

        CardResponse result = cardService.getById(CARD_ID);

        assertThat(result).isEqualTo(response);
        verify(cardMapper).toResponse(card);
    }

    @Test
    void getById_shouldThrowForbidden_whenPrivateParentDeckIsOwnedByAnotherUser() {
        Card card = card();
        Deck deck = deckOwnedBy(OWNER_ID);
        deck.setIsPublic(false);
        when(securityUtils.getCurrentUserId()).thenReturn(OTHER_USER_ID);
        when(cardRepository.findById(CARD_ID)).thenReturn(Optional.of(card));
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));

        assertThatThrownBy(() -> cardService.getById(CARD_ID))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessage("Access denied: private deck");

        verify(cardMapper, never()).toResponse(any());
    }

    @Test
    void getPublicCards_shouldReturnOnlyRepositoryFilteredPublicCards() {
        Card publicCard = card();
        CardResponse response = cardResponse();
        when(cardRepository.findAllByDeckIsPublicTrue()).thenReturn(List.of(publicCard));
        when(cardMapper.toResponse(publicCard)).thenReturn(response);

        List<CardResponse> result = cardService.getPublicCards();

        assertThat(result).containsExactly(response);
        verify(cardRepository).findAllByDeckIsPublicTrue();
        verify(cardRepository, never()).findAll();
    }

    @Test
    void create_shouldThrowForbidden_whenUserIsNotDeckOwner() {
        Deck deck = deckOwnedBy(OWNER_ID);
        when(securityUtils.getCurrentUserEmail()).thenReturn("other@example.com");
        when(securityUtils.getCurrentUserId()).thenReturn(OTHER_USER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));

        assertThatThrownBy(() -> cardService.create(DECK_ID, cardRequest()))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessageContaining("not deck owner");

        verify(cardRepository, never()).saveAndFlush(any());
        verify(entityManager, never()).refresh(any());
    }

    @Test
    void generateBulk_shouldThrowForbidden_whenUserIsNotDeckOwner() {
        Deck deck = deckOwnedBy(OWNER_ID);
        when(securityUtils.getCurrentUserEmail()).thenReturn("other@example.com");
        when(securityUtils.getCurrentUserId()).thenReturn(OTHER_USER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));

        BulkCardGenerateRequest request = new BulkCardGenerateRequest(List.of("hello"), DECK_ID);

        assertThatThrownBy(() -> cardService.createBulk(request))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessageContaining("not deck owner");

        verify(cardRepository, never()).saveAndFlush(any());
        verify(aiCardGenerationService, never()).generateCardData(any(), any(), any());
        verify(entityManager, never()).refresh(any());
    }

    @Test
    void create_shouldSucceed_whenUserIsDeckOwner() {
        Deck deck = deckOwnedBy(OWNER_ID);
        CardRequest request = cardRequest();
        Card card = new Card();
        card.setTitle(request.title());
        CardResponse response = new CardResponse(
            1L, DECK_ID, request.title(), request.definition(), request.synonyms(),
            request.examples(), request.translation(), null, null
        );
        when(securityUtils.getCurrentUserEmail()).thenReturn("owner@example.com");
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(cardMapper.toEntity(request)).thenReturn(card);
        when(cardRepository.saveAndFlush(card)).thenReturn(card);
        when(cardMapper.toResponse(card)).thenReturn(response);

        CardResponse result = cardService.create(DECK_ID, request);

        assertThat(result).isEqualTo(response);
        verify(cardRepository).saveAndFlush(card);
        verify(entityManager).refresh(card);
        verify(cardMapper).toResponse(card);
        verify(aiCardGenerationService, never()).generateCardData(any(), any(), any());
    }

    @Test
    void create_shouldNormalizeBlankDefinition_whenTranslationIsPresent() {
        Deck deck = deckOwnedBy(OWNER_ID);
        CardRequest request = new CardRequest(
            "title", "  ", List.of(), List.of(), " translation ");
        Card card = new Card();
        card.setDefinition(request.definition());
        card.setTranslation(request.translation());
        CardResponse response = cardResponse();
        when(securityUtils.getCurrentUserEmail()).thenReturn("owner@example.com");
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(cardMapper.toEntity(request)).thenReturn(card);
        when(cardRepository.saveAndFlush(card)).thenReturn(card);
        when(cardMapper.toResponse(card)).thenReturn(response);

        cardService.create(DECK_ID, request);

        assertThat(card.getDefinition()).isNull();
        assertThat(card.getTranslation()).isEqualTo("translation");
        verify(cardRepository).saveAndFlush(card);
    }

    @Test
    void generate_shouldRejectAiCard_whenTranslationIsMissingEvenWithDefinition() {
        Deck deck = deckOwnedBy(OWNER_ID);
        GenerateCardRequest request = new GenerateCardRequest("title", DECK_ID);
        AiCardData emptyAiData = new AiCardData("Useful definition", List.of(), List.of(), null);
        when(securityUtils.getCurrentUserEmail()).thenReturn("owner@example.com");
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(aiCardGenerationService.generateCardData(
            request.title(), deck.getSourceLanguage(), deck.getTargetLanguage()))
            .thenReturn(emptyAiData);

        assertThatThrownBy(() -> cardService.generate(request))
            .isInstanceOf(AiServiceException.class)
            .hasMessage("Generated card has no translation");

        verify(cardRepository, never()).saveAndFlush(any());
        verify(entityManager, never()).refresh(any());
    }

    @Test
    void generateBulk_shouldSucceed_whenUserIsDeckOwner() {
        Deck deck = deckOwnedBy(OWNER_ID);
        AiCardData aiData = new AiCardData("def", List.of(), List.of(), "translation");
        Card generatedCard = new Card();
        generatedCard.setTitle("hello");
        CardResponse response = new CardResponse(
            1L, DECK_ID, "hello", aiData.definition(), aiData.synonyms(),
            aiData.examples(), aiData.translation(), null, null
        );
        when(securityUtils.getCurrentUserEmail()).thenReturn("owner@example.com");
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(aiCardGenerationService.generateCardData("hello", deck.getSourceLanguage(), deck.getTargetLanguage()))
            .thenReturn(aiData);
        when(cardMapper.fromAiData("hello", aiData, deck)).thenReturn(generatedCard);
        when(cardRepository.saveAndFlush(generatedCard)).thenReturn(generatedCard);
        when(cardMapper.toResponse(generatedCard)).thenReturn(response);

        BulkCardGenerateRequest request = new BulkCardGenerateRequest(List.of("hello"), DECK_ID);

        List<CardResponse> results = cardService.createBulk(request);

        assertThat(results).containsExactly(response);
        verify(cardRepository).saveAndFlush(generatedCard);
        verify(entityManager).refresh(generatedCard);
        verify(cardMapper).toResponse(generatedCard);
    }

    @Test
    void generateBulk_shouldSkipCard_whenTranslationIsMissingEvenWithDefinition() {
        Deck deck = deckOwnedBy(OWNER_ID);
        AiCardData emptyAiData = new AiCardData("Useful definition", List.of(), List.of(), "  ");
        when(securityUtils.getCurrentUserEmail()).thenReturn("owner@example.com");
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(aiCardGenerationService.generateCardData(
            "hello", deck.getSourceLanguage(), deck.getTargetLanguage()))
            .thenReturn(emptyAiData);

        List<CardResponse> results = cardService.createBulk(
            new BulkCardGenerateRequest(List.of("hello"), DECK_ID));

        assertThat(results).isEmpty();
        verify(cardRepository, never()).saveAndFlush(any());
        verify(entityManager, never()).refresh(any());
    }

    @Test
    void generateBulk_shouldThrowBadRequest_whenSizeExceedsLimit() {
        when(securityUtils.getCurrentUserEmail()).thenReturn("owner@example.com");
        aiProperties.setMaxBulkSize(50);

        List<String> titles = IntStream.range(0, 51)
            .mapToObj(i -> "title" + i)
            .toList();
        BulkCardGenerateRequest request = new BulkCardGenerateRequest(titles, DECK_ID);

        assertThatThrownBy(() -> cardService.createBulk(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Bulk size exceeds limit");

        verify(deckRepository, never()).findWithOwnerById(any());
        verify(cardRepository, never()).saveAndFlush(any());
        verify(aiCardGenerationService, never()).generateCardData(any(), any(), any());
        verify(entityManager, never()).refresh(any());
    }

    @Test
    void generateBulk_shouldNotThrow_whenSizeEqualsLimit() {
        Deck deck = deckOwnedBy(OWNER_ID);
        aiProperties.setMaxBulkSize(50);

        AiCardData aiData = new AiCardData("def", List.of(), List.of(), "translation");
        Card generatedCard = new Card();
        generatedCard.setTitle("title");
        CardResponse response = new CardResponse(
            1L, DECK_ID, "title", aiData.definition(), aiData.synonyms(),
            aiData.examples(), aiData.translation(), null, null
        );

        when(securityUtils.getCurrentUserEmail()).thenReturn("owner@example.com");
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(aiCardGenerationService.generateCardData(any(), any(), any())).thenReturn(aiData);
        when(cardMapper.fromAiData(any(), any(), any())).thenReturn(generatedCard);
        when(cardRepository.saveAndFlush(generatedCard)).thenReturn(generatedCard);
        when(cardMapper.toResponse(generatedCard)).thenReturn(response);

        List<String> titles = IntStream.range(0, 50)
            .mapToObj(i -> "title" + i)
            .toList();
        BulkCardGenerateRequest request = new BulkCardGenerateRequest(titles, DECK_ID);

        List<CardResponse> results = cardService.createBulk(request);

        assertThat(results).hasSize(50);
        verify(deckRepository).findWithOwnerById(DECK_ID);
    }
}
