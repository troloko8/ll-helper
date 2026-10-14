package com.llhelper.deck.dto.request;

import com.llhelper.common.model.Language;
import com.llhelper.deck.enums.PublicDeckSort;

public record PublicDeckQuery(
    String q,
    Language sourceLanguage,
    Language targetLanguage,
    Boolean enrolled,
    PublicDeckSort sort,
    int page,
    int size
) {
    public static final int MAX_QUERY_LENGTH = 100;
}
