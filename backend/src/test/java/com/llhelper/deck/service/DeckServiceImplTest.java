package com.llhelper.deck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.llhelper.common.model.Language;
import com.llhelper.common.security.SecurityUtils;
import com.llhelper.common.security.UserRateLimiter;
import com.llhelper.deck.access.DeckAccessPolicy;
import com.llhelper.deck.dto.request.DeckRequest;
import com.llhelper.deck.dto.response.DeckResponse;
import com.llhelper.deck.entity.Deck;
import com.llhelper.deck.mapper.DeckMapper;
import com.llhelper.deck.repository.DeckRepository;
import com.llhelper.user.entity.User;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class DeckServiceImplTest {

    private static final Long OWNER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;
    private static final Long DECK_ID = 10L;

    @Mock
    private DeckRepository deckRepository;

    @Mock
    private SecurityUtils securityUtils;

    @Mock
    private DeckMapper deckMapper;

    @Mock
    private UserRateLimiter userRateLimiter;

    @Mock
    private EntityManager entityManager;

    private DeckServiceImpl deckService;

    @BeforeEach
    void setUp() {
        DeckAccessPolicy deckAccessPolicy = new DeckAccessPolicy(securityUtils);
        deckService = new DeckServiceImpl(
            deckRepository,
            securityUtils,
            deckMapper,
            userRateLimiter,
            deckAccessPolicy
        );
        ReflectionTestUtils.setField(deckService, "entityManager", entityManager);
    }

    private static Deck deckOwnedBy(Long ownerId) {
        User owner = new User();
        owner.setId(ownerId);

        Deck deck = new Deck();
        deck.setId(DECK_ID);
        deck.setTitle("Deck");
        deck.setSourceLanguage(Language.EN);
        deck.setTargetLanguage(Language.RU);
        deck.setOwner(owner);
        return deck;
    }

    private static DeckRequest deckRequest() {
        return new DeckRequest("New title", "desc", Language.EN, Language.RU, true);
    }

    @Test
    void getById_shouldSucceed_whenDeckIsPublic() {
        Deck deck = deckOwnedBy(OWNER_ID);
        DeckResponse response = new DeckResponse(
            DECK_ID, deck.getTitle(), null, deck.getSourceLanguage(), deck.getTargetLanguage(),
            null, null, null, true, List.of()
        );
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(deckMapper.toResponse(deck)).thenReturn(response);

        DeckResponse result = deckService.getById(DECK_ID);

        assertThat(result).isEqualTo(response);
        verify(deckMapper).toResponse(deck);
    }

    @Test
    void getById_shouldSucceed_whenPrivateDeckIsOwnedByCurrentUser() {
        Deck deck = deckOwnedBy(OWNER_ID);
        deck.setIsPublic(false);
        DeckResponse response = new DeckResponse(
            DECK_ID, deck.getTitle(), null, deck.getSourceLanguage(), deck.getTargetLanguage(),
            null, null, null, false, List.of()
        );
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(deckMapper.toResponse(deck)).thenReturn(response);

        DeckResponse result = deckService.getById(DECK_ID);

        assertThat(result).isEqualTo(response);
        verify(deckMapper).toResponse(deck);
    }

    @Test
    void getById_shouldThrowForbidden_whenPrivateDeckIsOwnedByAnotherUser() {
        Deck deck = deckOwnedBy(OWNER_ID);
        deck.setIsPublic(false);
        when(securityUtils.getCurrentUserId()).thenReturn(OTHER_USER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));

        assertThatThrownBy(() -> deckService.getById(DECK_ID))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessage("Access denied: private deck");

        verify(deckMapper, never()).toResponse(any());
    }

    @Test
    void update_shouldThrowForbidden_whenUserIsNotOwner() {
        Deck deck = deckOwnedBy(OWNER_ID);
        when(securityUtils.getCurrentUserId()).thenReturn(OTHER_USER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));

        assertThatThrownBy(() -> deckService.update(DECK_ID, deckRequest()))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessageContaining("not deck owner");

        verify(deckRepository, never()).saveAndFlush(any());
        verify(deckMapper, never()).updateEntity(any(), any());
        verify(entityManager, never()).refresh(any());
    }

    @Test
    void delete_shouldThrowForbidden_whenUserIsNotOwner() {
        Deck deck = deckOwnedBy(OWNER_ID);
        when(securityUtils.getCurrentUserId()).thenReturn(OTHER_USER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));

        assertThatThrownBy(() -> deckService.delete(DECK_ID))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessageContaining("not deck owner");

        verify(deckRepository, never()).deleteById(DECK_ID);
    }

    @Test
    void update_shouldSucceed_whenUserIsOwner() {
        Deck deck = deckOwnedBy(OWNER_ID);
        DeckRequest request = deckRequest();
        DeckResponse response = new DeckResponse(
            DECK_ID, request.title(), request.description(), request.sourceLanguage(),
            request.targetLanguage(), null, null, null, request.isPublic(), List.of()
        );
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));
        when(deckRepository.saveAndFlush(deck)).thenReturn(deck);
        when(deckMapper.toResponse(deck)).thenReturn(response);

        DeckResponse result = deckService.update(DECK_ID, request);

        assertThat(result).isEqualTo(response);
        verify(deckMapper).updateEntity(request, deck);
        verify(deckRepository).saveAndFlush(deck);
        verify(entityManager).refresh(deck);
        verify(deckMapper).toResponse(deck);
    }

    @Test
    void delete_shouldSucceed_whenUserIsOwner() {
        Deck deck = deckOwnedBy(OWNER_ID);
        when(securityUtils.getCurrentUserId()).thenReturn(OWNER_ID);
        when(deckRepository.findWithOwnerById(DECK_ID)).thenReturn(Optional.of(deck));

        deckService.delete(DECK_ID);

        verify(deckRepository).deleteById(DECK_ID);
    }
}
