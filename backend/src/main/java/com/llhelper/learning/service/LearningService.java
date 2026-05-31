package com.llhelper.learning.service;

import com.llhelper.learning.dto.request.CardReviewRequest;
import com.llhelper.learning.dto.response.CardReviewResponse;
import com.llhelper.learning.dto.response.DeckCardResponse;
import java.util.List;

public interface LearningService {

    void enrollDeck(Long deckId);

    List<DeckCardResponse> getStudyCards(Long deckId);

    List<DeckCardResponse> getDeckCards(Long deckId);
    
    CardReviewResponse reviewCard(Long cardId, CardReviewRequest request);
}
