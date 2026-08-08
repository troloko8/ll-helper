package com.llhelper.card.support;

import com.llhelper.card.dto.request.BulkCardGenerateRequest;
import com.llhelper.card.dto.request.CardRequest;
import com.llhelper.card.dto.response.CardResponse;
import java.time.Instant;
import java.util.List;
import java.util.stream.IntStream;

public final class CardTestData {

    private CardTestData() {
    }

    public static final Long CARD_ID = 1L;
    public static final Long DECK_ID = 2L;

    public static CardRequest defaultRequest() {
        return new CardRequest("word", "definition", List.of(), List.of(), "translation", DECK_ID, false);
    }

    public static CardRequest defaultRequest(long deckId) {
        return new CardRequest("word", "definition", List.of(), List.of(), "translation", deckId, false);
    }

    public static CardResponse defaultResponse(long id, CardRequest request) {
        return new CardResponse(
            id,
            request.deckId(),
            request.title(),
            request.definition(),
            request.synonyms(),
            request.examples(),
            request.translation(),
            Instant.EPOCH,
            Instant.EPOCH
        );
    }

    public static CardResponse defaultResponse(long id) {
        return defaultResponse(id, defaultRequest());
    }

    public static BulkCardGenerateRequest bulkGenerateRequest(int size) {
        return bulkGenerateRequest(size, DECK_ID);
    }

    public static BulkCardGenerateRequest bulkGenerateRequest(int size, long deckId) {
        List<String> titles = IntStream.range(0, size).mapToObj(i -> "title" + i).toList();
        return new BulkCardGenerateRequest(titles, deckId);
    }
}
