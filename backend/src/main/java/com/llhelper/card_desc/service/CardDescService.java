package com.llhelper.card_desc.service;

import com.llhelper.card_desc.dto.request.CardDescRequest;
import com.llhelper.card_desc.dto.response.CardDescListResponse;
import com.llhelper.card_desc.dto.response.CardDescResponse;
import java.util.List;

public interface CardDescService {
    CardDescResponse create(CardDescRequest request);
    CardDescResponse getById(Long id);
    // FIXME: change naming get rif of "List" suffix and remove CardDescResponse n=it should be instead of CardDescListResponse
    List<CardDescListResponse> getAll();
    CardDescResponse update(Long id, CardDescRequest request);
    void delete(Long id);
}
