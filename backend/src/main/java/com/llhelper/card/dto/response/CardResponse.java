package com.llhelper.card.dto.response;

import java.time.LocalDateTime;

public record CardResponse(
    Long id,
    String title,
    String description,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
