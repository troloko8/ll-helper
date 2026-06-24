package com.llhelper.card.service;

import com.llhelper.ai.dto.AiCardData;
import com.llhelper.ai.service.AiCardGenerationService;
import com.llhelper.card.dto.request.BulkCardGenerateRequest;
import com.llhelper.card.dto.request.CardRequest;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card.entity.Card;
import com.llhelper.card.mapper.CardMapper;
import com.llhelper.card.repository.CardRepository;
import com.llhelper.card_desc.entity.CardDesc;
import com.llhelper.card_desc.repository.CardDescRepository;
import com.llhelper.common.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final CardDescRepository cardDescRepository;
    private final AiCardGenerationService aiCardGenerationService;
    private final SecurityUtils securityUtils;
    private final CardMapper cardMapper;

    // FIXME maybe better lombok in future
    public CardServiceImpl(
        CardRepository cardRepository,
        CardDescRepository cardDescRepository,
        AiCardGenerationService aiCardGenerationService,
        SecurityUtils securityUtils,
        CardMapper cardMapper
    ) {
        this.cardRepository = cardRepository;
        this.cardDescRepository = cardDescRepository;
        this.aiCardGenerationService = aiCardGenerationService;
        this.securityUtils = securityUtils;
        this.cardMapper = cardMapper;
    }

    private void validateDeckOwnership(CardDesc deck) {
        Long currentUserId = securityUtils.getCurrentUserId();
        if (!Objects.equals(deck.getOwner().getId(), currentUserId)) {
            throw new AccessDeniedException("Access denied: not deck owner");
        }
    }

    private void validateCardOwnership(Card card) {
        CardDesc deck = cardDescRepository.findWithOwnerById(card.getCardDescId())
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + card.getCardDescId()));
        validateDeckOwnership(deck);
    }


    @Override
    @Transactional
    public CardResponse create(CardRequest request) {
        CardDesc cardDesc = cardDescRepository.findWithOwnerById(request.cardDescId())
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + request.cardDescId()));

        validateDeckOwnership(cardDesc);

        Card card = cardMapper.toEntity(request);

        if (Boolean.TRUE.equals(request.autoGenerate())) {
            AiCardData aiData = aiCardGenerationService.generateCardData(
                request.title(),
                cardDesc.getSourceLanguage(),
                cardDesc.getTargetLanguage()
            );
            card.setDefinition(aiData.definition());
            card.setSynonyms(aiData.synonyms());
            card.setExamples(aiData.examples());
            card.setTranslation(aiData.translation());
        }

        card.setCardDesc(cardDesc);
        card.setCreatedAt(LocalDateTime.now());
        card.setUpdatedAt(LocalDateTime.now());
        Card saved = cardRepository.save(card);
        // Manual sync: cardDescId is read-only (insertable=false, updatable=false)
        // Hibernate doesn't populate it after save(), so we set it explicitly
        saved.setCardDescId(cardDesc.getId());
        return cardMapper.toResponse(saved);
    }

    @Override
    @Transactional
    // TODO: probably i want that it was like partial transaction
    public List<CardResponse> createBulk(BulkCardGenerateRequest request) {
        CardDesc cardDesc = cardDescRepository.findWithOwnerById(request.cardDescId())
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + request.cardDescId()));

        validateDeckOwnership(cardDesc);

        List<CardResponse> results = new ArrayList<>();

        for (String title : request.titles()) {
            try {
                AiCardData aiData = aiCardGenerationService.generateCardData(
                    title,
                    cardDesc.getSourceLanguage(),
                    cardDesc.getTargetLanguage()
                );

                // TODO later mapper fo this if possible
                Card card = new Card();
                card.setTitle(title);
                card.setDefinition(aiData.definition());
                card.setSynonyms(aiData.synonyms());
                card.setExamples(aiData.examples());
                card.setTranslation(aiData.translation());
                card.setCardDesc(cardDesc);
                card.setCreatedAt(LocalDateTime.now());
                card.setUpdatedAt(LocalDateTime.now());

                Card saved = cardRepository.save(card);
                // Manual sync: cardDescId is read-only (insertable=false, updatable=false)
                saved.setCardDescId(cardDesc.getId());
                results.add(cardMapper.toResponse(saved));
            } catch (Exception e) {
                // TODO: finish the code later
                // Continue with next card - don't fail entire batch
                // In production, you might want to log this or collect failed titles
            }
        }

        return results;
    }

    @Override
    public CardResponse getById(Long id) {
        Card card = cardRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Card not found: " + id));
        return cardMapper.toResponse(card);
    }

    @Override
    public List<CardResponse> getAll() {
        return cardRepository.findAll().stream()
            .map(cardMapper::toResponse)
            .toList();
    }

    @Override
    public CardResponse update(Long id, CardRequest request) {
        Card card = cardRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Card not found: " + id));

        validateCardOwnership(card);

        cardMapper.updateEntity(request, card);
        card.setUpdatedAt(LocalDateTime.now());
        
        return cardMapper.toResponse(cardRepository.save(card));
    }

    @Override
    public void delete(Long id) {
        Card card = cardRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Card not found: " + id));

        validateCardOwnership(card);

        cardRepository.deleteById(id);
    }
}
