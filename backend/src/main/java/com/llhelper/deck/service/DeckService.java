package com.llhelper.deck.service;

import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.request.PublicDeckQuery;
import com.llhelper.deck.dto.response.DeckDetailsResponse;
import com.llhelper.deck.dto.response.DeckResponse;
import com.llhelper.deck.dto.response.OwnedDeckListResponse;
import com.llhelper.deck.dto.response.PublicDeckPageResponse;
import java.util.List;

public interface DeckService {
    DeckResponse create(DeckRequest request);
    DeckDetailsResponse getById(Long id);
    PublicDeckPageResponse getPublicDecks(PublicDeckQuery query);
    List<OwnedDeckListResponse> getCurrentUserDecks();
    DeckResponse update(Long id, DeckRequest request);
    void delete(Long id);
}
