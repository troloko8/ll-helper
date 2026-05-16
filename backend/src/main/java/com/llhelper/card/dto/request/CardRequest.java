package com.llhelper.card.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CardRequest(
    @NotBlank String title,
    String definition,
    List<String> synonyms,
    List<String> examples,
    String translation,
    Long cardDescId
) {
}
