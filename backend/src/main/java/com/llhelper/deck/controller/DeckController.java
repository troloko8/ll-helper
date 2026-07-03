package com.llhelper.deck.controller;

import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.response.DeckListResponse;
import com.llhelper.deck.dto.response.DeckResponse;
import com.llhelper.deck.service.DeckService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/decks")
public class DeckController {

    private final DeckService deckService;

    public DeckController(DeckService deckService) {
        this.deckService = deckService;
    }

    @PostMapping
    public ResponseEntity<DeckResponse> create(@Valid @RequestBody DeckRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deckService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeckResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<DeckListResponse>> getAll() {
        return ResponseEntity.ok(deckService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeckResponse> update(@PathVariable Long id, @Valid @RequestBody DeckRequest request) {
        return ResponseEntity.ok(deckService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deckService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
