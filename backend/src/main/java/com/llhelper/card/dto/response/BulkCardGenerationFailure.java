package com.llhelper.card.dto.response;

public record BulkCardGenerationFailure(
    int inputIndex,
    String title,
    BulkCardGenerationFailureCode code,
    String message,
    boolean retryable
) {
}
