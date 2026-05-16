package com.llhelper.card.service;

import com.llhelper.card.dto.request.CardRequest;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card.entity.Card;
import com.llhelper.card.repository.CardRepository;
import com.llhelper.card_desc.entity.CardDesc;
import com.llhelper.card_desc.repository.CardDescRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final CardDescRepository cardDescRepository;

    public CardServiceImpl(CardRepository cardRepository, CardDescRepository cardDescRepository) {
        this.cardRepository = cardRepository;
        this.cardDescRepository = cardDescRepository;
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
    public CardResponse create(CardRequest request) {
        CardDesc cardDesc = cardDescRepository.findById(request.cardDescId())
            .orElseThrow(() -> new RuntimeException("CardDesc not found: " + request.cardDescId()));
        Card card = new Card();
        card.setTitle(request.title());
        card.setDefinition(request.definition());
        card.setSynonyms(request.synonyms());
        card.setExamples(request.examples());
        card.setTranslation(request.translation());
        card.setCardDesc(cardDesc);
        card.setCreatedAt(LocalDateTime.now());
        card.setUpdatedAt(LocalDateTime.now());
        return toResponse(cardRepository.save(card));
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
