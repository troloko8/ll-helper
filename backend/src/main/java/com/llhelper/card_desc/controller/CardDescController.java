package com.llhelper.card_desc.controller;

import com.llhelper.card_desc.dto.request.CardDescRequest;
import com.llhelper.card_desc.dto.response.CardDescListResponse;
import com.llhelper.card_desc.dto.response.CardDescResponse;
import com.llhelper.card_desc.service.CardDescService;
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
@RequestMapping("/api/v1/card-descs")
public class CardDescController {

    private final CardDescService cardDescService;

    public CardDescController(CardDescService cardDescService) {
        this.cardDescService = cardDescService;
    }

    @PostMapping
    public ResponseEntity<CardDescResponse> create(@Valid @RequestBody CardDescRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cardDescService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CardDescResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(cardDescService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<CardDescListResponse>> getAll() {
        return ResponseEntity.ok(cardDescService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CardDescResponse> update(@PathVariable Long id, @Valid @RequestBody CardDescRequest request) {
        return ResponseEntity.ok(cardDescService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cardDescService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
