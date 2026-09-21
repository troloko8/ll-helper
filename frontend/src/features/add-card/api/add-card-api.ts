import type { CardResponseDto } from '@/entities/card'
import { baseApi } from '@/shared/api'
import type { CardRequestDto, GenerateCardRequestDto } from '../model/types'

interface AddCardMutationArgs {
    deckId: number
    body: CardRequestDto
}

export const addCardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        addCard: builder.mutation<CardResponseDto, AddCardMutationArgs>({
            query: ({ deckId, body }) => ({
                url: `/decks/${deckId}/cards`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _error, { deckId }) => [
                { type: 'Deck', id: deckId },
            ],
        }),
        generateCard: builder.mutation<CardResponseDto, GenerateCardRequestDto>(
            {
                query: (body) => ({
                    url: '/card-generations',
                    method: 'POST',
                    body,
                }),
                invalidatesTags: (_result, _error, { deckId }) => [
                    { type: 'Deck', id: deckId },
                ],
            },
        ),
    }),
})

export const { useAddCardMutation, useGenerateCardMutation } = addCardApi
