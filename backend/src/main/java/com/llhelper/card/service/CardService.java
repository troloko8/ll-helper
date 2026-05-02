package com.llhelper.card.service;

import com.llhelper.card.dto.request.CardRequest;
import com.llhelper.card.dto.response.CardResponse;
import java.util.List;

public interface CardService {
    CardResponse create(CardRequest request);
    CardResponse getById(Long id);
    List<CardResponse> getAll();
    CardResponse update(Long id, CardRequest request);
    void delete(Long id);
}
