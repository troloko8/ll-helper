package com.llhelper.card.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CardRequest(
    @NotBlank String title,
    String description,
    Long cardDescId
) {
}
