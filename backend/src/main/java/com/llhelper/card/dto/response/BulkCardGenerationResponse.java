package com.llhelper.card.dto.response;

import java.util.List;

public record BulkCardGenerationResponse(
    List<CardResponse> created,
    List<BulkCardGenerationFailure> failed
) {
}
