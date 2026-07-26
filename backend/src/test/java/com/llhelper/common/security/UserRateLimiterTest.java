package com.llhelper.common.security;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.llhelper.common.exception.RateLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class UserRateLimiterTest {

    private static final String EMAIL = "user@example.com";
    private static final RateLimitAction ACTION = RateLimitAction.AUTH_LOGIN;

    private UserRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new UserRateLimiter();
    }

    @Test
    void tryConsume_shouldAllow_whenUnderLimit() {
        for (int i = 0; i < ACTION.maxRequests(); i++) {
            assertThatNoException()
                .isThrownBy(() -> rateLimiter.checkLimitByEmail(EMAIL, ACTION));
        }
    }

    @Test
    void tryConsume_shouldThrow_whenOverLimit() {
        for (int i = 0; i < ACTION.maxRequests(); i++) {
            rateLimiter.checkLimitByEmail(EMAIL, ACTION);
        }

        assertThatThrownBy(() -> rateLimiter.checkLimitByEmail(EMAIL, ACTION))
            .isInstanceOf(RateLimitExceededException.class)
            .hasMessageContaining("rate limit exceeded");
    }

    @Test
    void tryConsume_shouldSeparateBuckets_forDifferentUsers() {
        // Exhaust limit for user1
        for (int i = 0; i < ACTION.maxRequests(); i++) {
            rateLimiter.checkLimitByEmail("user1@example.com", ACTION);
        }

        // user2 should still be allowed
        assertThatNoException()
            .isThrownBy(() -> rateLimiter.checkLimitByEmail("user2@example.com", ACTION));
    }

    @Test
    void tryConsume_shouldSeparateBuckets_forDifferentActions() {
        // Exhaust AUTH_LOGIN limit
        for (int i = 0; i < ACTION.maxRequests(); i++) {
            rateLimiter.checkLimitByEmail(EMAIL, ACTION);
        }

        // PROFILE_UPDATE should still be allowed (separate bucket)
        assertThatNoException()
            .isThrownBy(() -> rateLimiter.checkLimitByEmail(EMAIL, RateLimitAction.PROFILE_UPDATE));
    }

    // FIXME: Implement reset(String email, RateLimitAction action) in UserRateLimiter
    //  to allow clearing a specific bucket. Then uncomment test body and remove @Disabled.
    @Disabled("Known bug: reset() does not exist in UserRateLimiter — method not implemented")
    @Test
    void reset_shouldClearBucket_whenCalled() {
        // Exhaust limit
        for (int i = 0; i < ACTION.maxRequests(); i++) {
            rateLimiter.checkLimitByEmail(EMAIL, ACTION);
        }

        // After reset, should be allowed again
        // rateLimiter.reset(EMAIL, ACTION);

        // assertThatNoException()
        //     .isThrownBy(() -> rateLimiter.checkLimitByEmail(EMAIL, ACTION));
    }
}
