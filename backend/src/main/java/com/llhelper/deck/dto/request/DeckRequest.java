package com.llhelper.deck.dto.request;

import com.llhelper.common.model.Language;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DeckRequest(
    @Size(min = 1, max = 100, message = "title must be between 1 and 100 characters")
    @NotBlank String title,
    @Size(max = 500, message = "Description must be less than 500 characters")
    String description,
    @NotNull(message = "sourceLanguage is required")
    Language sourceLanguage,
    @NotNull(message = "targetLanguage is required")
    Language targetLanguage,
    Boolean isPublic
) {
}
