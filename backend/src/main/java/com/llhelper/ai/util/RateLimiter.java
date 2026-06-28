package com.llhelper.ai.util;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
public class RateLimiter {

    private final Semaphore requestSemaphore;
    private final int maxRequestsPerSecond;
    private final AtomicInteger tokensUsed = new AtomicInteger(0);
    private volatile Instant lastReset = Instant.now();

    public RateLimiter(int maxRequestsPerSecond) {
        this.maxRequestsPerSecond = maxRequestsPerSecond;
        this.requestSemaphore = new Semaphore(maxRequestsPerSecond);
    }

    public void acquirePermit() {
        resetIfNeeded();
        try {
            if (!requestSemaphore.tryAcquire(5, TimeUnit.SECONDS)) {
                throw new RateLimitExceededException("Too many AI requests. Please try again later.");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RateLimitExceededException("Request interrupted");
        }
    }

    public void validateTokenCount(int estimatedTokens) {
        if (estimatedTokens > 4000) {
            throw new RateLimitExceededException("Request too large. Maximum 4000 tokens allowed.");
        }
    }

    // FIXME Why it not uses nowhere
    public void validateBulkSize(int size, int maxBulkSize) {
        if (size > maxBulkSize) {
            throw new RateLimitExceededException(
                "Bulk size exceeds maximum of " + maxBulkSize + " cards"
            );
        }
    }

    private void resetIfNeeded() {
        Instant now = Instant.now();
        if (Duration.between(lastReset, now).getSeconds() >= 1) {
            requestSemaphore.release(maxRequestsPerSecond - requestSemaphore.availablePermits());
            lastReset = now;
        }
    }

    public static class RateLimitExceededException extends RuntimeException {
        public RateLimitExceededException(String message) {
            super(message);
        }
    }
}
