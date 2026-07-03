package com.llhelper.deck.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DeckRequest(
    @Size(min = 1, max = 100, message = "title must be between 1 and 100 characters")
    @NotBlank String title,
    @Size(max = 500, message = "Description must be less than 500 characters")
    String description,
    @NotBlank
    @Size(min = 2, max = 10, message = "sourceLanguage must be between 2 and 10 characters")
    @Pattern(regexp = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$", message = "sourceLanguage must be a valid ISO language code (e.g. en, ru, zh-CN)")
    String sourceLanguage,
    @NotBlank
    @Size(min = 2, max = 10, message = "targetLanguage must be between 2 and 10 characters")
    @Pattern(regexp = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$", message = "targetLanguage must be a valid ISO language code (e.g. en, ru, zh-CN)")
    String targetLanguage,
    Boolean isPublic
) {
}
