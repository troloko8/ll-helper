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
            invalidatesTags: (_result, _error, { deckId }) => [
                { type: 'Deck', id: deckId },
                { type: 'Deck', id: 'LIST' },
            ],
        }),
        deleteDeck: builder.mutation<void, number>({
            query: (deckId) => ({ url: `/decks/${deckId}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, deckId) => [
                { type: 'Deck', id: deckId },
                { type: 'Deck', id: 'LIST' },
                { type: 'LearningDeck', id: deckId },
                { type: 'LearningDeck', id: 'LIST' },
                { type: 'LearningCards', id: deckId },
                { type: 'StudySession', id: deckId },
            ],
        }),
    }),
})

export const { useUpdateDeckMutation, useDeleteDeckMutation } = editDeckApi
