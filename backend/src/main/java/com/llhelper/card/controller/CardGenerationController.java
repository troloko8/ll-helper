package com.llhelper.card.controller;

import com.llhelper.card.dto.request.BulkCardGenerateRequest;
import com.llhelper.card.dto.request.GenerateCardRequest;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card.service.CardService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/card-generations")
public class CardGenerationController {
    private final CardService cardService;

    public CardGenerationController(CardService cardService) {
        this.cardService = cardService;
    }

    @PostMapping
    public ResponseEntity<CardResponse> generate(@Valid @RequestBody GenerateCardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cardService.generate(request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<CardResponse>> generateBulk(@Valid @RequestBody BulkCardGenerateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cardService.createBulk(request));
    }
}
