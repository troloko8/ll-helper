package com.llhelper.card.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CardRequest(
    @Size(max = 100, message = "Title must be less than 100 characters")
    @NotBlank String title,
    @Size(max = 1000, message = "Definition must be less than 1000 characters")
    String definition,
    @Size(max = 20, message = "Synonyms list must contain at most 20 items")
    List<@NotBlank @Size(max = 100, message = "Synonym must be less than 100 characters") String> synonyms,
    @Size(max = 20, message = "Examples list must contain at most 20 items")
    List<@NotBlank @Size(max = 500, message = "Example must be less than 500 characters") String> examples,
    @Size(max = 200, message = "Translation must be less than 200 characters")
    String translation,
    @Positive
    @NotNull Long deckId,
    Boolean autoGenerate
) {
}
