package com.llhelper.card_desc.service;

import com.llhelper.auth.entity.AuthUser;
import com.llhelper.auth.repository.AuthRepository;
import com.llhelper.card_desc.dto.request.CardDescRequest;
import com.llhelper.card_desc.dto.response.CardDescResponse;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card_desc.entity.CardDesc;
import com.llhelper.card_desc.repository.CardDescRepository;
import com.llhelper.user.dto.response.UserResponse;
import com.llhelper.user.entity.User;
import com.llhelper.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CardDescServiceImpl implements CardDescService {

    private final CardDescRepository cardDescRepository;
    private final UserRepository userRepository;
    private final AuthRepository authRepository;

    public CardDescServiceImpl(CardDescRepository cardDescRepository, UserRepository userRepository, AuthRepository authRepository) {
        this.cardDescRepository = cardDescRepository;
        this.userRepository = userRepository;
        this.authRepository = authRepository;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        String email = authentication.getName();
        AuthUser authUser = authRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("AuthUser not found: " + email));
        return userRepository.findByAuthUserId(authUser.getId())
            .orElseThrow(() -> new RuntimeException("User not found for authUserId: " + authUser.getId()));
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
        cardDesc.setOwner(getCurrentUser());
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
