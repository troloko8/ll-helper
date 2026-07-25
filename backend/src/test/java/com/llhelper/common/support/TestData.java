package com.llhelper.common.support;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

/**
 * Cross-domain test fixtures shared across all modules.
 * Domain-specific fixtures belong in {@code <module>/support/<Module>TestData.java}.
 */
public final class TestData {

    private TestData() {
    }

    public static Clock fixedClock() {
        return Clock.fixed(Instant.parse("2024-01-01T10:00:00Z"), ZoneOffset.UTC);
    }
}
