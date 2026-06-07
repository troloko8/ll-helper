package com.llhelper.card.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CardRequest(
    // FIXME: work with sizes in other DTOs
    @Size(max = 100, message = "Title must be less than 100 characters")
    @NotBlank String title,
    String definition,
    List<String> synonyms,
    List<String> examples,
    String translation,
    @Positive
    @NotNull Long cardDescId,
    Boolean autoGenerate
) {
}
