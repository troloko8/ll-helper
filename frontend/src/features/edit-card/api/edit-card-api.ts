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

const cardContentTags = (deckId: number) => [
    { type: 'Deck' as const, id: deckId },
    { type: 'LearningDeck' as const, id: deckId },
    { type: 'LearningCards' as const, id: deckId },
    { type: 'StudySession' as const, id: deckId },
]

const cardRemovalTags = (deckId: number) => [
    ...cardContentTags(deckId),
    { type: 'LearningDeck' as const, id: 'LIST' },
    { type: 'LearningProgress' as const, id: 'LIST' },
]

export const editCardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        updateCard: builder.mutation<CardResponseDto, UpdateCardArgs>({
            query: ({ cardId, body }) => ({
                url: `/cards/${cardId}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, error, { cardId, deckId }) =>
                error
                    ? []
                    : [
                          { type: 'Card', id: cardId },
                          ...cardContentTags(deckId),
                      ],
        }),
        deleteCard: builder.mutation<void, DeleteCardArgs>({
            query: ({ cardId }) => ({
                url: `/cards/${cardId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, error, { cardId, deckId }) =>
                error
                    ? []
                    : [
                          { type: 'Card', id: cardId },
                          ...cardRemovalTags(deckId),
                      ],
        }),
    }),
})

export const { useUpdateCardMutation, useDeleteCardMutation } = editCardApi
