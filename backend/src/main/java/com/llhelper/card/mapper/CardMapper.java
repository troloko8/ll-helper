package com.llhelper.card.mapper;

import com.llhelper.ai.dto.AiCardData;
import com.llhelper.card.dto.request.CardRequest;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card.entity.Card;
import com.llhelper.deck.entity.Deck;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.stereotype.Component;

/**
 * MapStruct mapper for Card entity.
 * Converts between Card entity and DTOs (CardRequest/CardResponse).
 * Generated implementation is auto-injected as Spring bean.
 */
@Component
@Mapper(componentModel = "spring")
public interface CardMapper {

    @Mapping(target = "deckId", source = "deck.id")
    CardResponse toResponse(Card card);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deck", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    // FIXME check it later
    Card toEntity(CardRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deck", ignore = true)
    @Mapping(target = "deckId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CardRequest request, @MappingTarget Card card);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "title", source = "title")
    @Mapping(target = "definition", source = "aiCardData.definition")
    @Mapping(target = "synonyms", source = "aiCardData.synonyms")
    @Mapping(target = "examples", source = "aiCardData.examples")
    @Mapping(target = "translation", source = "aiCardData.translation")
    @Mapping(target = "deck", source = "deck")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deckId", ignore = true)
    Card fromAiData(String title, AiCardData aiCardData, Deck deck);
}
