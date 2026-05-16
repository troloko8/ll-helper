package com.llhelper.card_desc.service;

import com.llhelper.card_desc.dto.request.CardDescRequest;
import com.llhelper.card_desc.dto.response.CardDescResponse;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card_desc.entity.CardDesc;
import com.llhelper.card_desc.repository.CardDescRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CardDescServiceImpl implements CardDescService {

    private final CardDescRepository cardDescRepository;

    public CardDescServiceImpl(CardDescRepository cardDescRepository) {
        this.cardDescRepository = cardDescRepository;
    }

    private CardDescResponse toResponse(CardDesc cardDesc) {
        List<CardResponse> cards = cardDesc.getCards().stream()
            .map(card -> new CardResponse(
                card.getId(),
                card.getTitle(),
                card.getDefinition(),
                card.getSynonyms(),
                card.getExamples(),
                card.getTranslation(),
                card.getCreatedAt(),
                card.getUpdatedAt()
            ))
            .toList();
        return new CardDescResponse(
            cardDesc.getId(),
            cardDesc.getTitle(),
            cardDesc.getDescription(),
            cardDesc.getCreatedAt(),
            cardDesc.getUpdatedAt(),
            cards
        );
    }

    @Override
    public CardDescResponse create(CardDescRequest request) {
        CardDesc cardDesc = new CardDesc();
        cardDesc.setTitle(request.title());
        cardDesc.setDescription(request.description());
        cardDesc.setCreatedAt(LocalDateTime.now());
        cardDesc.setUpdatedAt(LocalDateTime.now());
        return toResponse(cardDescRepository.save(cardDesc));
    }

    @Override
    public CardDescResponse getById(Long id) {
        CardDesc cardDesc = cardDescRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CardDesc not found: " + id));
        return toResponse(cardDesc);
    }

    @Override
    public List<CardDescResponse> getAll() {
        return cardDescRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    public CardDescResponse update(Long id, CardDescRequest request) {
        CardDesc cardDesc = cardDescRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CardDesc not found: " + id));
        cardDesc.setTitle(request.title());
        cardDesc.setDescription(request.description());
        cardDesc.setUpdatedAt(LocalDateTime.now());
        return toResponse(cardDescRepository.save(cardDesc));
    }

    @Override
    public void delete(Long id) {
        cardDescRepository.deleteById(id);
    }
}
