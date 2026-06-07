package com.llhelper.card_desc.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CardDescRequest(
    @Size(min = 1, max = 100, message = "title must be between 1 and 100 characters")
    @NotBlank String title,
    String description,
    @NotBlank String sourceLanguage,
    @NotBlank String targetLanguage,
    Boolean isPublic
) {
}
