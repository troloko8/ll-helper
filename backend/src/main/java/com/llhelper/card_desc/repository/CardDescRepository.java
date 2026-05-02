package com.llhelper.card_desc.repository;

import com.llhelper.card_desc.entity.CardDesc;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardDescRepository extends JpaRepository<CardDesc, Long> {
}
