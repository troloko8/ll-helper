package com.llhelper.deck.mapper;

import com.llhelper.card.mapper.CardMapper;
import com.llhelper.common.model.Language;
import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.response.DeckResponse;
import com.llhelper.deck.dto.response.OwnedDeckListResponse;
import com.llhelper.deck.dto.response.PublicDeckListResponse;
import com.llhelper.deck.entity.Deck;
import com.llhelper.deck.repository.DeckRepository;
import com.llhelper.user.dto.response.UserResponse;
import com.llhelper.user.mapper.UserMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.springframework.stereotype.Component;

/**
 * Converts between Deck entities and deck DTOs.
 * Uses CardMapper and UserMapper for nested mappings.
 */
@Component
@Mapper(componentModel = "spring", uses = {CardMapper.class, UserMapper.class})
public interface DeckMapper {

    DeckResponse toResponse(Deck deck);

    @Mapping(target = "sourceLanguage", source = "sourceLanguage", qualifiedByName = "toLanguage")
    @Mapping(target = "targetLanguage", source = "targetLanguage", qualifiedByName = "toLanguage")
    @Mapping(target = "owner", source = "projection", qualifiedByName = "toOwnerResponse")
    PublicDeckListResponse toPublicListResponse(DeckRepository.PublicDeckListProjection projection);

    @Mapping(target = "sourceLanguage", source = "sourceLanguage", qualifiedByName = "toLanguage")
    @Mapping(target = "targetLanguage", source = "targetLanguage", qualifiedByName = "toLanguage")
    OwnedDeckListResponse toOwnedListResponse(DeckRepository.OwnedDeckListProjection projection);

    @Named("toOwnerResponse")
    @Mapping(target = "id", source = "ownerId")
    @Mapping(target = "username", source = "ownerUsername")
    @Mapping(target = "firstName", source = "ownerFirstName")
    @Mapping(target = "lastName", source = "ownerLastName")
    @Mapping(target = "nativeLanguage", source = "ownerNativeLanguage")
    @Mapping(target = "targetLanguage", source = "ownerTargetLanguage")
    @Mapping(target = "avatarUrl", source = "ownerAvatarUrl")
    @Mapping(target = "uiLanguage", source = "ownerUiLanguage")
    @Mapping(target = "createdAt", source = "ownerCreatedAt")
    @Mapping(target = "updatedAt", source = "ownerUpdatedAt")
    UserResponse toOwnerResponse(DeckRepository.PublicDeckListProjection projection);

    @Named("toLanguage")
    default Language toLanguage(String value) {
        return value == null ? null : Language.valueOf(value);
    }

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
