import type { DeckRequestDto, DeckResponseDto } from '@/entities/deck'
import { baseApi } from '@/shared/api'

interface UpdateDeckArgs {
    deckId: number
    body: DeckRequestDto
}

export const editDeckApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        updateDeck: builder.mutation<DeckResponseDto, UpdateDeckArgs>({
            query: ({ deckId, body }) => ({
                url: `/decks/${deckId}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, error, { deckId }) =>
                error
                    ? []
                    : [
                          { type: 'Deck', id: deckId },
                          { type: 'Deck', id: 'LIST' },
                          { type: 'LearningDeck', id: deckId },
                          { type: 'LearningDeck', id: 'LIST' },
                          { type: 'LearningProgress', id: 'LIST' },
                          { type: 'StudySession', id: deckId },
                      ],
        }),
        deleteDeck: builder.mutation<void, number>({
            query: (deckId) => ({ url: `/decks/${deckId}`, method: 'DELETE' }),
            invalidatesTags: (_result, error, deckId) =>
                error
                    ? []
                    : [
                          { type: 'Deck', id: deckId },
                          { type: 'Deck', id: 'LIST' },
                          { type: 'LearningDeck', id: deckId },
                          { type: 'LearningDeck', id: 'LIST' },
                          { type: 'LearningProgress', id: 'LIST' },
                          { type: 'LearningCards', id: deckId },
                          { type: 'StudySession', id: deckId },
                      ],
        }),
    }),
})

export const { useUpdateDeckMutation, useDeleteDeckMutation } = editDeckApi
