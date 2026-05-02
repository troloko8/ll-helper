package com.llhelper.card_desc.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CardDescRequest(
    @NotBlank String title,
    String description
) {
}
