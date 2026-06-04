package com.llhelper.card_desc.repository;

import com.llhelper.card_desc.entity.CardDesc;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CardDescRepository extends JpaRepository<CardDesc, Long> {

    @EntityGraph(attributePaths = {"owner"})
    Optional<CardDesc> findWithOwnerById(Long id);
}
