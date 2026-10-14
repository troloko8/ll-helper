package com.llhelper.deck.controller;

import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.request.PublicDeckQuery;
import com.llhelper.deck.dto.response.DeckDetailsResponse;
import com.llhelper.deck.dto.response.DeckResponse;
import com.llhelper.deck.dto.response.OwnedDeckListResponse;
import com.llhelper.deck.dto.response.PublicDeckListResponse;
import com.llhelper.deck.dto.response.PublicDeckPageResponse;
import com.llhelper.deck.enums.PublicDeckSort;
import com.llhelper.common.model.Language;
import com.llhelper.deck.service.DeckService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@Validated
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

    @GetMapping("/mine")
    public ResponseEntity<List<OwnedDeckListResponse>> getCurrentUserDecks() {
        return ResponseEntity.ok(deckService.getCurrentUserDecks());
    }

    @GetMapping("/creator/{username}")
    public ResponseEntity<List<PublicDeckListResponse>> getCreatorPublicDecks(
        @PathVariable String username
    ) {
        return ResponseEntity.ok(deckService.getCreatorPublicDecks(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeckDetailsResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.getById(id));
    }

    @GetMapping
    public ResponseEntity<PublicDeckPageResponse> getPublicDecks(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) Language sourceLanguage,
        @RequestParam(required = false) Language targetLanguage,
        @RequestParam(required = false) Boolean enrolled,
        @RequestParam(defaultValue = "NEWEST") PublicDeckSort sort,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "12") @Min(1) @Max(50) int size
    ) {
        if (q != null && q.trim().length() > PublicDeckQuery.MAX_QUERY_LENGTH) {
            throw new IllegalArgumentException(
                "q must not exceed " + PublicDeckQuery.MAX_QUERY_LENGTH + " characters after trimming"
            );
        }

        return ResponseEntity.ok(deckService.getPublicDecks(
            new PublicDeckQuery(q, sourceLanguage, targetLanguage, enrolled, sort, page, size)
        ));
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
