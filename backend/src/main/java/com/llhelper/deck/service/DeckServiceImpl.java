package com.llhelper.deck.service;

import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.response.DeckListResponse;
import com.llhelper.deck.dto.response.DeckResponse;
import com.llhelper.deck.entity.Deck;
import com.llhelper.deck.mapper.DeckMapper;
import com.llhelper.deck.repository.DeckRepository;
import com.llhelper.common.security.RateLimitAction;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.common.security.UserRateLimiter;
import com.llhelper.deck.access.DeckAccessPolicy;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Objects;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepository;
    private final SecurityUtils securityUtils;
    private final DeckMapper deckMapper;
    private final UserRateLimiter userRateLimiter;
    private final DeckAccessPolicy deckAccessPolicy;

    @PersistenceContext
    private EntityManager entityManager;

    public DeckServiceImpl(
        DeckRepository deckRepository,
        SecurityUtils securityUtils,
        DeckMapper deckMapper,
        UserRateLimiter userRateLimiter,
        DeckAccessPolicy deckAccessPolicy
    ) {
        this.deckRepository = deckRepository;
        this.securityUtils = securityUtils;
        this.deckMapper = deckMapper;
        this.userRateLimiter = userRateLimiter;
        this.deckAccessPolicy = deckAccessPolicy;
    }

    private void validateDeckOwnership(Deck deck) {
        Long currentUserId = securityUtils.getCurrentUserId();
        if (!Objects.equals(deck.getOwner().getId(), currentUserId)) {
            throw new AccessDeniedException("Access denied: not deck owner");
        }
    }



    @Override
    @Transactional
    public DeckResponse create(DeckRequest request) {
        userRateLimiter.checkLimitByEmail(securityUtils.getCurrentUserEmail(), RateLimitAction.DECK_CREATE);

        Deck deck = deckMapper.toEntity(request);
        deck.setIsPublic(request.isPublic() != null ? request.isPublic() : true);
        deck.setOwner(securityUtils.getCurrentUser());
        Deck saved = deckRepository.saveAndFlush(deck);
        entityManager.refresh(saved);
        return deckMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DeckResponse getById(Long id) {
        Deck deck = deckRepository.findWithOwnerById(id)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + id));
        deckAccessPolicy.validateReadAccess(deck);
        return deckMapper.toResponse(deck);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckListResponse> getAll() {
        return deckRepository.findAll().stream()
            .map(deckMapper::toListResponse)
            .toList();
    }

    @Override
    @Transactional
    public DeckResponse update(Long id, DeckRequest request) {
        userRateLimiter.checkLimitByEmail(securityUtils.getCurrentUserEmail(), RateLimitAction.DECK_UPDATE);

        Deck deck = deckRepository.findWithOwnerById(id)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + id));
        
        validateDeckOwnership(deck);
        
        deckMapper.updateEntity(request, deck);
        Deck saved = deckRepository.saveAndFlush(deck);
        entityManager.refresh(saved);
        return deckMapper.toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        userRateLimiter.checkLimitByEmail(securityUtils.getCurrentUserEmail(), RateLimitAction.DECK_DELETE);

        Deck deck = deckRepository.findWithOwnerById(id)
            .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + id));
        
        validateDeckOwnership(deck);
        
        deckRepository.deleteById(id);
    }
}
