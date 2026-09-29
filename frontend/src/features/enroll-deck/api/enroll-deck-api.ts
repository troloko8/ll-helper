import type { EnrollResponseDto } from '@/entities/learning'
import { baseApi } from '@/shared/api'

export const enrollDeckApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        enrollDeck: builder.mutation<EnrollResponseDto, number>({
            query: (deckId) => ({
                url: `/decks/${deckId}/enroll`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, deckId) => [
                { type: 'LearningDeck', id: 'LIST' },
                { type: 'Deck', id: 'LIST' },
                { type: 'Deck', id: deckId },
            ],
        }),
    }),
})

export const { useEnrollDeckMutation } = enrollDeckApi
