package com.llhelper.card.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record GenerateCardRequest(
    @NotBlank @Size(max = 100, message = "Title must be less than 100 characters") String title,
    @NotNull @Positive Long deckId
) {}
