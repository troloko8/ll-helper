package com.llhelper.card.repository;

import com.llhelper.card.entity.Card;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardRepository extends JpaRepository<Card, Long> {
    List<Card> findAllByDeckIsPublicTrue();
}
