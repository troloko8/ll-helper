package com.llhelper.learning.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CardReviewRequest(
    @NotBlank String userAnswer
) {
}
