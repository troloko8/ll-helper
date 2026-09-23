package com.llhelper.deck.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.llhelper.common.model.Language;
import com.llhelper.deck.dto.response.OwnedDeckListResponse;
import com.llhelper.deck.dto.response.PublicDeckListResponse;
import com.llhelper.deck.repository.DeckRepository.OwnedDeckListProjection;
import com.llhelper.deck.repository.DeckRepository.PublicDeckListProjection;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class DeckMapperTest {

    private final DeckMapper deckMapper = Mappers.getMapper(DeckMapper.class);

    @Test
    void toPublicListResponse_shouldMapLanguagesAndOwner_whenProjectionIsValid() {
        Instant createdAt = Instant.parse("2026-09-20T10:00:00Z");
        Instant updatedAt = Instant.parse("2026-09-21T10:00:00Z");
        PublicDeckListProjection projection = mock(PublicDeckListProjection.class);
        when(projection.getId()).thenReturn(10L);
        when(projection.getTitle()).thenReturn("Public deck");
        when(projection.getSourceLanguage()).thenReturn("EN");
        when(projection.getTargetLanguage()).thenReturn("RU");
        when(projection.getOwnerId()).thenReturn(1L);
        when(projection.getOwnerUsername()).thenReturn("deck-owner");
        when(projection.getOwnerFirstName()).thenReturn("Deck");
        when(projection.getOwnerLastName()).thenReturn("Owner");
        when(projection.getOwnerNativeLanguage()).thenReturn("EN");
        when(projection.getOwnerTargetLanguage()).thenReturn("RU");
        when(projection.getOwnerAvatarUrl()).thenReturn("avatar.png");
        when(projection.getOwnerUiLanguage()).thenReturn("EN");
        when(projection.getOwnerCreatedAt()).thenReturn(createdAt);
        when(projection.getOwnerUpdatedAt()).thenReturn(updatedAt);
        when(projection.getCardCount()).thenReturn(3L);
        when(projection.getIsEnrolled()).thenReturn(true);

        PublicDeckListResponse result = deckMapper.toPublicListResponse(projection);

        assertThat(result.sourceLanguage()).isEqualTo(Language.EN);
        assertThat(result.targetLanguage()).isEqualTo(Language.RU);
        assertThat(result.cardCount()).isEqualTo(3);
        assertThat(result.isEnrolled()).isTrue();
        assertThat(result.owner().id()).isEqualTo(1L);
        assertThat(result.owner().username()).isEqualTo("deck-owner");
        assertThat(result.owner().createdAt()).isEqualTo(createdAt);
        assertThat(result.owner().updatedAt()).isEqualTo(updatedAt);
    }

    @Test
    void toOwnedListResponse_shouldMapLanguagesAndVisibility_whenProjectionIsValid() {
        OwnedDeckListProjection projection = mock(OwnedDeckListProjection.class);
        when(projection.getId()).thenReturn(11L);
        when(projection.getTitle()).thenReturn("Owned deck");
        when(projection.getSourceLanguage()).thenReturn("RU");
        when(projection.getTargetLanguage()).thenReturn("EN");
        when(projection.getIsPublic()).thenReturn(false);
        when(projection.getCardCount()).thenReturn(2L);

        OwnedDeckListResponse result = deckMapper.toOwnedListResponse(projection);

        assertThat(result.id()).isEqualTo(11L);
        assertThat(result.title()).isEqualTo("Owned deck");
        assertThat(result.sourceLanguage()).isEqualTo(Language.RU);
        assertThat(result.targetLanguage()).isEqualTo(Language.EN);
        assertThat(result.isPublic()).isFalse();
        assertThat(result.cardCount()).isEqualTo(2);
    }
}
