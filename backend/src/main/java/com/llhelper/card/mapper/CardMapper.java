package com.llhelper.card.mapper;

import com.llhelper.card.dto.request.CardRequest;
import com.llhelper.card.dto.response.CardResponse;
import com.llhelper.card.entity.Card;
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

    @Mapping(target = "cardDescId", source = "cardDesc.id")
    CardResponse toResponse(Card card);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cardDesc", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    // FIXME check it later
    Card toEntity(CardRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cardDesc", ignore = true)
    @Mapping(target = "cardDescId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CardRequest request, @MappingTarget Card card);
}
