package com.llhelper.learning.service;

import com.llhelper.learning.dto.request.CardReviewRequest;
import com.llhelper.learning.dto.response.CardReviewResponse;
import com.llhelper.learning.dto.response.DeckCardResponse;
import com.llhelper.learning.dto.response.EnrollResponse;
import com.llhelper.learning.dto.response.LearningDeckDetailsResponse;
import com.llhelper.learning.dto.response.LearningDeckResponse;
import com.llhelper.learning.dto.response.StudySessionResponse;
import java.util.List;

public interface LearningService {

    List<LearningDeckResponse> getMyDecks();

    LearningDeckDetailsResponse getLearningDeck(Long deckId);

    EnrollResponse enrollDeck(Long deckId);

    StudySessionResponse getStudySession(Long deckId);

    List<DeckCardResponse> getDeckCards(Long deckId);

    CardReviewResponse reviewCard(Long cardId, CardReviewRequest request);
}
