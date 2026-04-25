package com.llhelper.common.util;

import java.time.Instant;

public final class DateTimeUtil {

    private DateTimeUtil() {
    }

    public static Instant nowUtc() {
        return Instant.now();
    }
}
