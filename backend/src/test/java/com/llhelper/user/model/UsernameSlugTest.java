package com.llhelper.user.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class UsernameSlugTest {

    @Test
    void fromInput_shouldReturnCanonicalSlug_whenRawValueIsCompatible() {
        UsernameSlug usernameSlug = UsernameSlug.fromInput("  Jane_Doe-2  ");

        assertThat(usernameSlug.value()).isEqualTo("jane_doe-2");
    }

    @ParameterizedTest
    @MethodSource("canonicalBoundaryUsernames")
    void of_shouldAcceptValue_whenLengthIsAtBoundary(String username) {
        UsernameSlug usernameSlug = UsernameSlug.of(username);

        assertThat(usernameSlug.value()).isEqualTo(username);
    }

    @ParameterizedTest
    @MethodSource("outOfRangeUsernames")
    void fromInput_shouldRejectValue_whenNormalizedLengthIsOutsideBoundary(String username) {
        assertThatThrownBy(() -> UsernameSlug.fromInput(username))
            .isInstanceOf(InvalidUsernameSlugException.class)
            .hasMessage(UsernameSlug.VALIDATION_MESSAGE);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void fromInput_shouldRejectValue_whenRawValueIsNullOrBlank(String username) {
        assertThatThrownBy(() -> UsernameSlug.fromInput(username))
            .isInstanceOf(InvalidUsernameSlugException.class)
            .hasMessage(UsernameSlug.VALIDATION_MESSAGE);
    }

    @Test
    void fromInput_shouldRejectValue_whenNormalizedValueIsNotUrlSafe() {
        assertThatThrownBy(() -> UsernameSlug.fromInput("jane.doe"))
            .isInstanceOf(InvalidUsernameSlugException.class)
            .hasMessage(UsernameSlug.VALIDATION_MESSAGE);
    }

    @Test
    void of_shouldRejectValue_whenValueRequiresNormalization() {
        assertThatThrownBy(() -> UsernameSlug.of("Jane_Doe"))
            .isInstanceOf(InvalidUsernameSlugException.class)
            .hasMessage(UsernameSlug.VALIDATION_MESSAGE);
    }

    @ParameterizedTest
    @ValueSource(strings = {"-reader", "_reader", "reader-", "reader_"})
    void of_shouldRejectValue_whenSeparatorIsAtBoundary(String username) {
        assertThatThrownBy(() -> UsernameSlug.of(username))
            .isInstanceOf(InvalidUsernameSlugException.class)
            .hasMessage(UsernameSlug.VALIDATION_MESSAGE);
    }

    @ParameterizedTest
    @ValueSource(strings = {"polyglot_reader", "polyglot-reader"})
    void of_shouldAcceptValue_whenSeparatorIsInternal(String username) {
        UsernameSlug usernameSlug = UsernameSlug.of(username);

        assertThat(usernameSlug.value()).isEqualTo(username);
    }

    private static Stream<String> canonicalBoundaryUsernames() {
        return Stream.of("abc", "a".repeat(50));
    }

    private static Stream<String> outOfRangeUsernames() {
        return Stream.of("ab", "a".repeat(51));
    }
}
