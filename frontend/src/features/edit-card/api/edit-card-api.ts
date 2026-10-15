import type { CardRequestDto, CardResponseDto } from '@/entities/card'
import { baseApi } from '@/shared/api'

interface UpdateCardArgs {
    cardId: number
    deckId: number
    body: CardRequestDto
}

interface DeleteCardArgs {
    cardId: number
    deckId: number
}

const relatedTags = (deckId: number) => [
    { type: 'Deck' as const, id: deckId },
    { type: 'LearningDeck' as const, id: deckId },
    { type: 'LearningProgress' as const, id: 'LIST' },
    { type: 'LearningCards' as const, id: deckId },
    { type: 'StudySession' as const, id: deckId },
]

export const editCardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        updateCard: builder.mutation<CardResponseDto, UpdateCardArgs>({
            query: ({ cardId, body }) => ({
                url: `/cards/${cardId}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, _error, { cardId, deckId }) => [
                { type: 'Card', id: cardId },
                ...relatedTags(deckId),
            ],
        }),
        deleteCard: builder.mutation<void, DeleteCardArgs>({
            query: ({ cardId }) => ({
                url: `/cards/${cardId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, { cardId, deckId }) => [
                { type: 'Card', id: cardId },
                ...relatedTags(deckId),
            ],
        }),
    }),
})

export const { useUpdateCardMutation, useDeleteCardMutation } = editCardApi
