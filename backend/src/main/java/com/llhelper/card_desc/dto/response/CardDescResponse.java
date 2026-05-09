package com.llhelper.card_desc.dto.response;

import com.llhelper.card.dto.response.CardResponse;
import java.time.LocalDateTime;
import java.util.List;

public record CardDescResponse(
    Long id,
    String title,
    String description,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<CardResponse> cards
) {
}
