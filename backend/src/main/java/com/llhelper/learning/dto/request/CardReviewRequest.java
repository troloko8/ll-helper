package com.llhelper.learning.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CardReviewRequest(
    @Size(max = 100, message = "Answer must be less than 100 characters")
    @NotBlank String userAnswer
) {
}
