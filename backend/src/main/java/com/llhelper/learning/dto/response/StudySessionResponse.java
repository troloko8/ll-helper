package com.llhelper.learning.dto.response;

import java.util.List;

public record StudySessionResponse(Long deckId, String deckTitle, List<DeckCardResponse> cards) {}
