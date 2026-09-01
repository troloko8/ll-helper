package com.llhelper.deck.access;

import com.llhelper.common.security.SecurityUtils;
import com.llhelper.deck.entity.Deck;
import java.util.Objects;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class DeckAccessPolicy {

    private final SecurityUtils securityUtils;

    public DeckAccessPolicy(SecurityUtils securityUtils) {
        this.securityUtils = securityUtils;
    }

    public void validateReadAccess(Deck deck) {
        if (Boolean.TRUE.equals(deck.getIsPublic())) {
            return;
        }

        Long currentUserId = securityUtils.getCurrentUserId();
        if (!Objects.equals(deck.getOwner().getId(), currentUserId)) {
            throw new AccessDeniedException("Access denied: private deck");
        }
    }
}
