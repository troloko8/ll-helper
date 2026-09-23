package com.llhelper.deck.service;

import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.response.DeckResponse;
import com.llhelper.deck.dto.response.OwnedDeckListResponse;
import com.llhelper.deck.dto.response.PublicDeckListResponse;
import java.util.List;

public interface DeckService {
    DeckResponse create(DeckRequest request);
    DeckResponse getById(Long id);
    List<PublicDeckListResponse> getPublicDecks();
    List<OwnedDeckListResponse> getCurrentUserDecks();
    DeckResponse update(Long id, DeckRequest request);
    void delete(Long id);
}
