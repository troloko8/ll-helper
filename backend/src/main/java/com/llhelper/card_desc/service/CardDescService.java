package com.llhelper.card_desc.service;

import com.llhelper.card_desc.dto.request.CardDescRequest;
import com.llhelper.card_desc.dto.response.CardDescResponse;
import java.util.List;

public interface CardDescService {
    CardDescResponse create(CardDescRequest request);
    CardDescResponse getById(Long id);
    List<CardDescResponse> getAll();
    CardDescResponse update(Long id, CardDescRequest request);
    void delete(Long id);
}
