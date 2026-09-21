package com.llhelper.card.service;

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
import com.llhelper.deck.entity.Deck;
import com.llhelper.deck.repository.DeckRepository;
import com.llhelper.deck.access.DeckAccessPolicy;
import com.llhelper.common.security.RateLimitAction;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.common.security.UserRateLimiter;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final DeckRepository deckRepository;
    private final AiCardGenerationService aiCardGenerationService;
    private final SecurityUtils securityUtils;
    private final CardMapper cardMapper;
    private final UserRateLimiter userRateLimiter;
    private final AiProperties aiProperties;
    private final DeckAccessPolicy deckAccessPolicy;

    @PersistenceContext
    private EntityManager entityManager;

    // FIXME maybe better lombok in future
    public CardServiceImpl(
        CardRepository cardRepository,
        DeckRepository deckRepository,
        AiCardGenerationService aiCardGenerationService,
        SecurityUtils securityUtils,
        CardMapper cardMapper,
        UserRateLimiter userRateLimiter,
        AiProperties aiProperties,
        DeckAccessPolicy deckAccessPolicy
    ) {
        this.cardRepository = cardRepository;
        this.deckRepository = deckRepository;
        this.aiCardGenerationService = aiCardGenerationService;
        this.securityUtils = securityUtils;
        this.cardMapper = cardMapper;
        this.userRateLimiter = userRateLimiter;
        this.aiProperties = aiProperties;
        this.deckAccessPolicy = deckAccessPolicy;
    }

    private void validateDeckOwnership(Deck deck) {
        Long currentUserId = securityUtils.getCurrentUserId();
        if (!Objects.equals(deck.getOwner().getId(), currentUserId)) {
            throw new AccessDeniedException("Access denied: not deck owner");
        }
    }

    private void validateCardOwnership(Card card) {
        Deck deck = deckRepository.findWithOwnerById(card.getDeckId())
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + card.getDeckId()));
        validateDeckOwnership(deck);
    }

    private void validateBulkSize(BulkCardGenerateRequest request) {
        int maxBulkSize = aiProperties.getMaxBulkSize();
        if (request.titles().size() > maxBulkSize) {
            throw new IllegalArgumentException(
                "Bulk size exceeds limit: " + request.titles().size() + " > " + maxBulkSize);
        }
    }

    private void validateGeneratedTranslation(AiCardData aiData) {
        if (aiData.translation() == null || aiData.translation().isBlank()) {
            throw new AiServiceException("Generated card has no translation");
        }
    }

    @Override
    @Transactional
    public CardResponse create(Long deckId, CardRequest request) {
        String currentUserEmail = securityUtils.getCurrentUserEmail();
        userRateLimiter.checkLimitByEmail(currentUserEmail, RateLimitAction.CARD_CREATE);

        Deck deck = deckRepository.findWithOwnerById(deckId)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + deckId));

        validateDeckOwnership(deck);

        Card card = cardMapper.toEntity(request);

        card.setDeck(deck);
        return saveCard(card);
    }

    @Override
    @Transactional
    public CardResponse generate(GenerateCardRequest request) {
        userRateLimiter.checkLimitByEmail(securityUtils.getCurrentUserEmail(), RateLimitAction.CARD_CREATE);

        Deck deck = deckRepository.findWithOwnerById(request.deckId())
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + request.deckId()));
        validateDeckOwnership(deck);

        AiCardData aiData = aiCardGenerationService.generateCardData(
            request.title(), deck.getSourceLanguage(), deck.getTargetLanguage());

        validateGeneratedTranslation(aiData);

        return saveCard(cardMapper.fromAiData(request.title(), aiData, deck));
    }

    private CardResponse saveCard(Card card) {
        String definition = card.getDefinition();
        String translation = card.getTranslation();
        card.setDefinition(definition == null || definition.isBlank() ? null : definition.trim());
        card.setTranslation(translation == null || translation.isBlank() ? null : translation.trim());

        Card saved = cardRepository.saveAndFlush(card);
        entityManager.refresh(saved);
        return cardMapper.toResponse(saved);
    }

    @Override
    @Transactional
    // TODO: probably i want that it was like partial transaction
    public List<CardResponse> createBulk(BulkCardGenerateRequest request) {
        String currentUserEmail = securityUtils.getCurrentUserEmail();
        userRateLimiter.checkLimitByEmail(currentUserEmail, RateLimitAction.CARD_BULK_GENERATE);

        validateBulkSize(request);

        Deck deck = deckRepository.findWithOwnerById(request.deckId())
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + request.deckId()));

        validateDeckOwnership(deck);

        List<CardResponse> results = new ArrayList<>();
        List<String> failedTitles = new ArrayList<>();

        for (String title : request.titles()) {
            try {
                AiCardData aiData = aiCardGenerationService.generateCardData(
                    title,
                    deck.getSourceLanguage(),
                    deck.getTargetLanguage()
                );
                validateGeneratedTranslation(aiData);

                Card card = cardMapper.fromAiData(title, aiData, deck);
                results.add(saveCard(card));
            } catch (Exception e) {
                failedTitles.add(title);
                log.debug("Failed to generate card for title='{}' in deckId={}", title, deck.getId(), e);
            }
        }

        if (!failedTitles.isEmpty()) {
            log.warn("Bulk generation completed. Created: {}, Failed: {}. Failed titles: {}",
                results.size(), failedTitles.size(), failedTitles);
        }

        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public CardResponse getById(Long id) {
        Card card = cardRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Card not found: " + id));

        Deck deck = deckRepository.findWithOwnerById(card.getDeckId())
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + card.getDeckId()));
        deckAccessPolicy.validateReadAccess(deck);

        return cardMapper.toResponse(card);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CardResponse> getPublicCards() {
        return cardRepository.findAllByDeckIsPublicTrue().stream()
            .map(cardMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public CardResponse update(Long id, CardRequest request) {
        userRateLimiter.checkLimitByEmail(securityUtils.getCurrentUserEmail(), RateLimitAction.CARD_UPDATE);

        Card card = cardRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Card not found: " + id));

        validateCardOwnership(card);

        cardMapper.updateEntity(request, card);
        return saveCard(card);
    }

    @Override
    public void delete(Long id) {
        userRateLimiter.checkLimitByEmail(securityUtils.getCurrentUserEmail(), RateLimitAction.CARD_DELETE);

        Card card = cardRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Card not found: " + id));

        validateCardOwnership(card);

        cardRepository.deleteById(id);
    }
}
