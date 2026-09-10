package com.llhelper.deck.repository;

import com.llhelper.deck.entity.Deck;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeckRepository extends JpaRepository<Deck, Long> {

    @EntityGraph(attributePaths = {"owner"})
    Optional<Deck> findWithOwnerById(Long id);

    @EntityGraph(attributePaths = {"owner"})
    List<Deck> findAllByIsPublicTrue();

    @EntityGraph(attributePaths = {"owner"})
    List<Deck> findAllByOwnerId(Long ownerId);
}
