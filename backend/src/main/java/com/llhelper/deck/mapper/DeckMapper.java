package com.llhelper.deck.mapper;

import com.llhelper.card.mapper.CardMapper;
import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.response.DeckListResponse;
import com.llhelper.deck.dto.response.DeckResponse;
import com.llhelper.deck.entity.Deck;
import com.llhelper.user.mapper.UserMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.springframework.stereotype.Component;

/**
 * MapStruct mapper for Deck (Deck) entity.
 * Converts between Deck entity and DTOs (DeckRequest/DeckResponse/DeckListResponse).
 * Uses CardMapper and UserMapper for nested mappings.
 * Generated implementation is auto-injected as Spring bean.
 */
@Component
@Mapper(componentModel = "spring", uses = {CardMapper.class, UserMapper.class})
public interface DeckMapper {

    DeckResponse toResponse(Deck deck);

    DeckListResponse toListResponse(Deck deck);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "cards", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Deck toEntity(DeckRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "cards", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isPublic", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(DeckRequest request, @MappingTarget Deck deck);
}
