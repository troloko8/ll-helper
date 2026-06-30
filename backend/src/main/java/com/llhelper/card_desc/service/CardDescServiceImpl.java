package com.llhelper.card_desc.service;

import com.llhelper.card_desc.dto.request.CardDescRequest;
import com.llhelper.card_desc.dto.response.CardDescListResponse;
import com.llhelper.card_desc.dto.response.CardDescResponse;
import com.llhelper.card_desc.entity.CardDesc;
import com.llhelper.card_desc.mapper.CardDescMapper;
import com.llhelper.card_desc.repository.CardDescRepository;
import com.llhelper.common.security.RateLimitAction;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.common.security.UserRateLimiter;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CardDescServiceImpl implements CardDescService {

    private final CardDescRepository cardDescRepository;
    private final SecurityUtils securityUtils;
    private final CardDescMapper cardDescMapper;
    private final UserRateLimiter userRateLimiter;

    public CardDescServiceImpl(
        CardDescRepository cardDescRepository,
        SecurityUtils securityUtils,
        CardDescMapper cardDescMapper,
        UserRateLimiter userRateLimiter
    ) {
        this.cardDescRepository = cardDescRepository;
        this.securityUtils = securityUtils;
        this.cardDescMapper = cardDescMapper;
        this.userRateLimiter = userRateLimiter;
    }

    private void validateDeckOwnership(CardDesc deck) {
        Long currentUserId = securityUtils.getCurrentUserId();
        if (!Objects.equals(deck.getOwner().getId(), currentUserId)) {
            throw new AccessDeniedException("Access denied: not deck owner");
        }
    }



    @Override
    public CardDescResponse create(CardDescRequest request) {
        userRateLimiter.checkLimitByEmail(securityUtils.getCurrentUserEmail(), RateLimitAction.DECK_CREATE);

        CardDesc cardDesc = cardDescMapper.toEntity(request);
        cardDesc.setIsPublic(request.isPublic() != null ? request.isPublic() : true);
        cardDesc.setCreatedAt(LocalDateTime.now());
        cardDesc.setUpdatedAt(LocalDateTime.now());
        cardDesc.setOwner(securityUtils.getCurrentUser());
        return cardDescMapper.toResponse(cardDescRepository.save(cardDesc));
    }

    @Override
    @Transactional(readOnly = true)
    public CardDescResponse getById(Long id) {
        CardDesc cardDesc = cardDescRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + id));
        return cardDescMapper.toResponse(cardDesc);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CardDescListResponse> getAll() {
        return cardDescRepository.findAll().stream()
            .map(cardDescMapper::toListResponse)
            .toList();
    }

    @Override
    public CardDescResponse update(Long id, CardDescRequest request) {
        userRateLimiter.checkLimitByEmail(securityUtils.getCurrentUserEmail(), RateLimitAction.DECK_UPDATE);

        CardDesc cardDesc = cardDescRepository.findWithOwnerById(id)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + id));
        
        validateDeckOwnership(cardDesc);
        
        cardDescMapper.updateEntity(request, cardDesc);
        cardDesc.setUpdatedAt(LocalDateTime.now());
        
        return cardDescMapper.toResponse(cardDescRepository.save(cardDesc));
    }

    @Override
    public void delete(Long id) {
        userRateLimiter.checkLimitByEmail(securityUtils.getCurrentUserEmail(), RateLimitAction.DECK_DELETE);

        CardDesc cardDesc = cardDescRepository.findWithOwnerById(id)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + id));
        
        validateDeckOwnership(cardDesc);
        
        cardDescRepository.deleteById(id);
    }
}
