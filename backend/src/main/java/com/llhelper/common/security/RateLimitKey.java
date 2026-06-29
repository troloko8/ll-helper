package com.llhelper.common.security;

/**
 * Composite key for rate limiting cache.
 * <p>
 * Combines subject (user:123, email:test@example.com) with action type.
 * This allows different rate limits for the same user/email on different actions.
 */
public record RateLimitKey(
    String subject,
    RateLimitAction action
) {
}
