package com.llhelper.deck.service;

import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.response.DeckListResponse;
import com.llhelper.deck.dto.response.DeckResponse;
import java.util.List;

public interface DeckService {
    DeckResponse create(DeckRequest request);
    DeckResponse getById(Long id);
    // FIXME: change naming get rif of "List" suffix and remove DeckResponse n=it should be instead of DeckListResponse
    List<DeckListResponse> getAll();
    DeckResponse update(Long id, DeckRequest request);
    void delete(Long id);
}
