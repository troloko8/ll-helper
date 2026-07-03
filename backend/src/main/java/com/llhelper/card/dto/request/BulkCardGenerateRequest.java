package com.llhelper.card.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BulkCardGenerateRequest(
    @NotNull
    @Size(min = 1, max = 100, message = "Must contain between 1 and 100 titles")
    List<@NotBlank String> titles,

    @NotNull
    @Positive
    Long deckId
) {
}
