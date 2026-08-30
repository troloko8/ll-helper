package com.llhelper.learning.controller;

import com.llhelper.learning.dto.request.CardReviewRequest;
import com.llhelper.learning.dto.response.CardReviewResponse;
import com.llhelper.learning.dto.response.DeckCardResponse;
import com.llhelper.learning.dto.response.EnrollResponse;
import com.llhelper.learning.dto.response.LearningDeckResponse;
import com.llhelper.learning.service.LearningService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;

    @GetMapping("/learning/decks")
    public ResponseEntity<List<LearningDeckResponse>> getMyDecks() {
        return ResponseEntity.ok(learningService.getMyDecks());
    }

    @PostMapping("/decks/{deckId}/enroll")
    public ResponseEntity<EnrollResponse> enrollDeck(@PathVariable Long deckId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(learningService.enrollDeck(deckId));
    }

    @GetMapping("/decks/{deckId}/study/cards")
    public ResponseEntity<List<DeckCardResponse>> getStudyCards(@PathVariable Long deckId) {
        return ResponseEntity.ok(learningService.getStudyCards(deckId));
    }

    @GetMapping("/decks/{deckId}/cards")
    public ResponseEntity<List<DeckCardResponse>> getDeckCards(@PathVariable Long deckId) {
        return ResponseEntity.ok(learningService.getDeckCards(deckId));
    }

    @PostMapping("/cards/{cardId}/review")
    public ResponseEntity<CardReviewResponse> reviewCard(
        @PathVariable Long cardId,
        @Valid @RequestBody CardReviewRequest request
    ) {
        return ResponseEntity.ok(learningService.reviewCard(cardId, request));
    }
}
