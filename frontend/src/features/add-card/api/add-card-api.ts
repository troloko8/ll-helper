import type { CardRequestDto, CardResponseDto } from '@/entities/card'
import { baseApi } from '@/shared/api'
import type { GenerateCardRequestDto } from '../model/types'

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
            // TODO: Patch the cached owner deck and visible collection card counts
            // from the returned card; keep Learning/Study invalidation server-authoritative.
            invalidatesTags: (result, _error, { deckId }) => [
                { type: 'Deck', id: deckId },
                { type: 'Card', id: result?.id ?? 'LIST' },
                { type: 'LearningDeck', id: deckId },
                { type: 'LearningProgress', id: 'LIST' },
                { type: 'LearningCards', id: deckId },
                { type: 'StudySession', id: deckId },
            ],
        }),
        generateCard: builder.mutation<CardResponseDto, GenerateCardRequestDto>(
            {
                query: (body) => ({
                    url: '/card-generations',
                    method: 'POST',
                    body,
                }),
                // TODO: Apply the same targeted content-cache patch as addCard.
                invalidatesTags: (result, _error, { deckId }) => [
                    { type: 'Deck', id: deckId },
                    { type: 'Card', id: result?.id ?? 'LIST' },
                    { type: 'LearningDeck', id: deckId },
                    { type: 'LearningProgress', id: 'LIST' },
                    { type: 'LearningCards', id: deckId },
                    { type: 'StudySession', id: deckId },
                ],
            },
        ),
    }),
})

export const { useAddCardMutation, useGenerateCardMutation } = addCardApi
