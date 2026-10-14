package com.llhelper.deck.dto.response;

import java.util.List;

public record PublicDeckPageResponse(
    List<PublicDeckListResponse> items,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean hasNext
) {
}
