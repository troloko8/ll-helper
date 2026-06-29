package com.llhelper.common.security;

import java.time.Duration;

/**
 * Rate limiting actions with predefined limits.
 * <p>
 * Each action defines its own {@code maxRequests} and {@code window}.
 * This prevents hardcoding limits in service layer and ensures consistency.
 */
public enum RateLimitAction {

    AUTH_LOGIN(5, Duration.ofMinutes(1)),
    // TODO Level 2: AUTH_REGISTER should be rate limited by IP, not by email.
    // Email-based limit is weak — attacker can register with different emails indefinitely.
    // Target: 10 requests / 10 minutes per IP. Requires HttpServletRequest injection or filter-level limiting.
    AUTH_REGISTER(3, Duration.ofMinutes(5)),
    PROFILE_UPDATE(5, Duration.ofMinutes(1)),
    CARD_CREATE(20, Duration.ofMinutes(1)),
    CARD_UPDATE(10, Duration.ofMinutes(1)),
    CARD_DELETE(10, Duration.ofMinutes(1)),
    DECK_CREATE(5, Duration.ofHours(1)),
    DECK_UPDATE(10, Duration.ofMinutes(1)),
    DECK_DELETE(5, Duration.ofHours(1));

    private final int maxRequests;
    private final Duration window;

    RateLimitAction(int maxRequests, Duration window) {
        this.maxRequests = maxRequests;
        this.window = window;
    }

    public int maxRequests() {
        return maxRequests;
    }

    public Duration window() {
        return window;
    }
}
