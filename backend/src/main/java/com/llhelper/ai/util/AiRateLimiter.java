package com.llhelper.ai.util;

import com.llhelper.common.exception.RateLimitExceededException;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

public class AiRateLimiter {

    private final Semaphore requestSemaphore;
    private final int maxRequestsPerSecond;
    private final int maxTokensPerRequest;
    private volatile Instant lastReset = Instant.now();

    public AiRateLimiter(int maxRequestsPerSecond, int maxTokensPerRequest) {
        this.maxRequestsPerSecond = maxRequestsPerSecond;
        this.maxTokensPerRequest = maxTokensPerRequest;
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
        if (estimatedTokens > maxTokensPerRequest) {
            throw new RateLimitExceededException(
                "Request too large. Maximum " + maxTokensPerRequest + " tokens allowed."
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

}
