package com.llhelper.card_desc.service;

import com.llhelper.card_desc.dto.request.CardDescRequest;
import com.llhelper.card_desc.dto.response.CardDescListResponse;
import com.llhelper.card_desc.dto.response.CardDescResponse;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card_desc.entity.CardDesc;
import com.llhelper.card_desc.repository.CardDescRepository;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.user.dto.response.UserResponse;
import com.llhelper.user.entity.User;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CardDescServiceImpl implements CardDescService {

    private final CardDescRepository cardDescRepository;
    private final SecurityUtils securityUtils;

    public CardDescServiceImpl(CardDescRepository cardDescRepository, SecurityUtils securityUtils) {
        this.cardDescRepository = cardDescRepository;
        this.securityUtils = securityUtils;
    }


    // FIXME not sure about this, beacause for a now we dont need list of decks with inner cards
    // need to remove and do a toListResponse method as majorly used in getAll method
    private CardDescResponse toResponse(CardDesc cardDesc) {
        List<CardResponse> cards = cardDesc.getCards().stream()
            .map(card -> new CardResponse(
                card.getId(),
                cardDesc.getId(),
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
            toUserResponse(cardDesc.getOwner()),
            cardDesc.getIsPublic(),
            cards
        );
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getFirstName(),
            user.getLastName(),
            user.getNativeLanguage(),
            user.getTargetLanguage(),
            user.getAvatarUrl(),
            user.getUiLanguage(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }

    private CardDescListResponse toListResponse(CardDesc cardDesc) {
        return new CardDescListResponse(
            cardDesc.getId(),
            cardDesc.getTitle(),
            cardDesc.getDescription(),
            cardDesc.getSourceLanguage(),
            cardDesc.getTargetLanguage(),
            cardDesc.getCreatedAt(),
            cardDesc.getUpdatedAt(),
            toUserResponse(cardDesc.getOwner()),
            cardDesc.getIsPublic()
        );
    }

    @Override
    public CardDescResponse create(CardDescRequest request) {
        CardDesc cardDesc = new CardDesc();
        cardDesc.setTitle(request.title());
        cardDesc.setDescription(request.description());
        cardDesc.setSourceLanguage(request.sourceLanguage());
        cardDesc.setTargetLanguage(request.targetLanguage());
        cardDesc.setIsPublic(request.isPublic() != null ? request.isPublic() : true);
        cardDesc.setCreatedAt(LocalDateTime.now());
        cardDesc.setUpdatedAt(LocalDateTime.now());
        cardDesc.setOwner(securityUtils.getCurrentUser());
        return toResponse(cardDescRepository.save(cardDesc));
    }

    @Override
    public CardDescResponse getById(Long id) {
        CardDesc cardDesc = cardDescRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + id));
        return toResponse(cardDesc);
    }

    @Override
    public List<CardDescListResponse> getAll() {
        return cardDescRepository.findAll().stream()
            .map(this::toListResponse)
            .toList();
    }

    @Override
    public CardDescResponse update(Long id, CardDescRequest request) {
        CardDesc cardDesc = cardDescRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + id));
        cardDesc.setTitle(request.title());
        cardDesc.setDescription(request.description());
        cardDesc.setSourceLanguage(request.sourceLanguage());
        cardDesc.setTargetLanguage(request.targetLanguage());
        cardDesc.setUpdatedAt(LocalDateTime.now());
        return toResponse(cardDescRepository.save(cardDesc));
    }

    @Override
    public void delete(Long id) {
        cardDescRepository.deleteById(id);
    }
}
