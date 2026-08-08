package com.llhelper.deck.support;

import com.llhelper.common.model.Language;
import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.response.DeckResponse;
import com.llhelper.user.dto.response.UserResponse;
import java.time.Instant;
import java.util.List;

public final class DeckTestData {
    public static final Long DECK_ID = 1L;

    public static DeckRequest defaultRequest() {
        return new DeckRequest("Deck title", "desc", Language.EN, Language.RU, true);
    }

    public static DeckRequest blankTitleRequest() {
        return new DeckRequest("", "desc", Language.EN, Language.RU, true);
    }

    public static DeckResponse defaultResponse(long id, DeckRequest request) {
        return new DeckResponse(
            id,
            request.title(),
            request.description(),
            request.sourceLanguage(),
            request.targetLanguage(),
            Instant.EPOCH,
            Instant.EPOCH,
            (UserResponse) null,
            request.isPublic(),
            List.of()
        );
    }

    public static DeckResponse defaultResponse(long id) {
        return defaultResponse(id, defaultRequest());
    }
}
