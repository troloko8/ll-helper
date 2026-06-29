package com.llhelper.common.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.llhelper.common.exception.RateLimitExceededException;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import org.springframework.stereotype.Component;

/**
 * Per-user and per-email in-memory rate limiter using Caffeine Cache.
 * <p>
 * Uses composite key (subject + action) to support different rate limits
 * for different actions on the same user/email.
 * <p>
 * Each bucket uses fixed window counter algorithm. Inactive buckets are
 * automatically removed after {@link #CACHE_TTL}.
 * <p>
 * TODO: When JWT subject changes from email to userId, migrate auth endpoints
 * to use userId-based keys instead of email-based keys.
 */
@Component
public class UserRateLimiter {

    private static final Duration CACHE_TTL = Duration.ofHours(2);

    private final Cache<RateLimitKey, Bucket> buckets;

    public UserRateLimiter() {
        this.buckets = Caffeine.newBuilder()
            .expireAfterAccess(CACHE_TTL)
            .maximumSize(100_000)
            .build();
    }

    // TODO  later after token changes
    //    public void checkLimitByUserId(Long userId, RateLimitAction action) {
    //        if (userId == null) {
    //            throw new IllegalArgumentException("User id must not be null");
    //        }
    //
    //        RateLimitKey key = new RateLimitKey("user:" + userId, action);
    //        checkLimit(key, action);
    //    }

    public void checkLimitByEmail(String email, RateLimitAction action) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email must not be blank");
        }

        // TODO Level 2: Apply similar normalization (trim + toLowerCase(Locale.ROOT))
        // for username and other string-based identifiers if needed
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        RateLimitKey key = new RateLimitKey("email:" + normalizedEmail, action);
        checkLimit(key, action);
    }

    private void checkLimit(RateLimitKey key, RateLimitAction action) {
        Bucket bucket = buckets.get(key, ignored -> new Bucket());

        if (!bucket.tryConsume(action.maxRequests(), action.window())) {
            throw new RateLimitExceededException(
                action + " rate limit exceeded. Maximum "
                    + action.maxRequests()
                    + " requests per "
                    + formatDuration(action.window())
                    + ". Try again later."
            );
        }
    }

    private String formatDuration(Duration window) {
        long seconds = window.getSeconds();

        if (seconds < 60) {
            return seconds + " " + (seconds == 1 ? "second" : "seconds");
        }

        long minutes = seconds / 60;
        if (minutes < 60) {
            return minutes + " " + (minutes == 1 ? "minute" : "minutes");
        }

        long hours = minutes / 60;
        return hours + " " + (hours == 1 ? "hour" : "hours");
    }

    private static class Bucket {

        private int count = 0;
        private Instant windowStart = Instant.now();

        public synchronized boolean tryConsume(int maxRequests, Duration window) {
            Instant now = Instant.now();
            if (Duration.between(windowStart, now).compareTo(window) >= 0) {
                count = 0;
                windowStart = now;
            }
            if (count >= maxRequests) {
                return false;
            }
            count++;
            return true;
        }
    }
}
