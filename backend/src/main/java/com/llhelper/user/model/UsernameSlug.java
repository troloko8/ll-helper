package com.llhelper.user.model;

import java.util.Locale;
import java.util.regex.Pattern;

public record UsernameSlug(String value) {

    public static final int MIN_LENGTH = 3;
    public static final int MAX_LENGTH = 50;
    public static final String PATTERN = "^[a-z0-9](?:[a-z0-9_-]{1,48}[a-z0-9])$";
    public static final String VALIDATION_MESSAGE =
        "username must be 3 to 50 lowercase characters using only letters, numbers, underscores, or hyphens, "
            + "and must start and end with a letter or number";

    private static final Pattern CANONICAL_PATTERN = Pattern.compile(PATTERN);

    public UsernameSlug {
        validateCanonical(value);
    }

    public static UsernameSlug fromInput(String input) {
        return new UsernameSlug(normalize(input));
    }

    public static UsernameSlug of(String value) {
        return new UsernameSlug(value);
    }

    private static String normalize(String input) {
        return input == null
            ? null
            : input.trim().toLowerCase(Locale.ROOT);
    }

    private static void validateCanonical(String value) {
        if (value == null || !CANONICAL_PATTERN.matcher(value).matches()) {
            throw new InvalidUsernameSlugException(VALIDATION_MESSAGE);
        }
    }
}
