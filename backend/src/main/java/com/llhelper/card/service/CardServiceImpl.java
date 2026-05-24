package com.llhelper.card.service;

import com.llhelper.ai.dto.AiCardData;
import com.llhelper.ai.service.AiCardGenerationService;
import com.llhelper.card.dto.request.BulkCardGenerateRequest;
import com.llhelper.card.dto.request.CardRequest;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card.entity.Card;
import com.llhelper.card.repository.CardRepository;
import com.llhelper.card_desc.entity.CardDesc;
import com.llhelper.card_desc.repository.CardDescRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final CardDescRepository cardDescRepository;
    private final AiCardGenerationService aiCardGenerationService;

    public CardServiceImpl(
        CardRepository cardRepository,
        CardDescRepository cardDescRepository,
        AiCardGenerationService aiCardGenerationService
    ) {
        this.cardRepository = cardRepository;
        this.cardDescRepository = cardDescRepository;
        this.aiCardGenerationService = aiCardGenerationService;
    }

    private CardResponse toResponse(Card card) {
        return new CardResponse(
            card.getId(),
            card.getTitle(),
            card.getDefinition(),
            card.getSynonyms(),
            card.getExamples(),
            card.getTranslation(),
            card.getCreatedAt(),
            card.getUpdatedAt()
        );
    }

    @Override
    @Transactional
    public CardResponse create(CardRequest request) {
        CardDesc cardDesc = cardDescRepository.findById(request.cardDescId())
            .orElseThrow(() -> new RuntimeException("CardDesc not found: " + request.cardDescId()));

        Card card = new Card();
        card.setTitle(request.title());

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
        } else {
            card.setDefinition(request.definition());
            card.setSynonyms(request.synonyms());
            card.setExamples(request.examples());
            card.setTranslation(request.translation());
        }

        card.setCardDesc(cardDesc);
        card.setCreatedAt(LocalDateTime.now());
        card.setUpdatedAt(LocalDateTime.now());
        return toResponse(cardRepository.save(card));
    }

    @Override
    @Transactional
    // TODO: probably i want that it was like partial transaction
    public List<CardResponse> createBulk(BulkCardGenerateRequest request) {
        CardDesc cardDesc = cardDescRepository.findById(request.cardDescId())
            .orElseThrow(() -> new RuntimeException("CardDesc not found: " + request.cardDescId()));

        List<CardResponse> results = new ArrayList<>();

        for (String title : request.titles()) {
            try {
                AiCardData aiData = aiCardGenerationService.generateCardData(
                    title,
                    cardDesc.getSourceLanguage(),
                    cardDesc.getTargetLanguage()
                );

                Card card = new Card();
                card.setTitle(title);
                card.setDefinition(aiData.definition());
                card.setSynonyms(aiData.synonyms());
                card.setExamples(aiData.examples());
                card.setTranslation(aiData.translation());
                card.setCardDesc(cardDesc);
                card.setCreatedAt(LocalDateTime.now());
                card.setUpdatedAt(LocalDateTime.now());

                results.add(toResponse(cardRepository.save(card)));
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
            .orElseThrow(() -> new RuntimeException("Card not found: " + id));
        return toResponse(card);
    }

    @Override
    public List<CardResponse> getAll() {
        return cardRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    public CardResponse update(Long id, CardRequest request) {
        Card card = cardRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Card not found: " + id));
        card.setTitle(request.title());
        card.setDefinition(request.definition());
        card.setSynonyms(request.synonyms());
        card.setExamples(request.examples());
        card.setTranslation(request.translation());
        card.setUpdatedAt(LocalDateTime.now());
        return toResponse(cardRepository.save(card));
    }

    @Override
    public void delete(Long id) {
        cardRepository.deleteById(id);
    }
}
