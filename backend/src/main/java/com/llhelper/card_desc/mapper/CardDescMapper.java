package com.llhelper.card_desc.mapper;

import com.llhelper.card.mapper.CardMapper;
import com.llhelper.card_desc.dto.request.CardDescRequest;
import com.llhelper.card_desc.dto.response.CardDescListResponse;
import com.llhelper.card_desc.dto.response.CardDescResponse;
import com.llhelper.card_desc.entity.CardDesc;
import com.llhelper.user.mapper.UserMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.stereotype.Component;

/**
 * MapStruct mapper for CardDesc (Deck) entity.
 * Converts between CardDesc entity and DTOs (CardDescRequest/CardDescResponse/CardDescListResponse).
 * Uses CardMapper and UserMapper for nested mappings.
 * Generated implementation is auto-injected as Spring bean.
 */
@Component
@Mapper(componentModel = "spring", uses = {CardMapper.class, UserMapper.class})
public interface CardDescMapper {

    CardDescResponse toResponse(CardDesc cardDesc);

    CardDescListResponse toListResponse(CardDesc cardDesc);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "cards", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    CardDesc toEntity(CardDescRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "cards", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CardDescRequest request, @MappingTarget CardDesc cardDesc);
}
