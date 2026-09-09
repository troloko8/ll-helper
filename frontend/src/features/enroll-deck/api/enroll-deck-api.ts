import type { EnrollResponseDto } from '@/entities/learning'
import { baseApi } from '@/shared/api'

export const enrollDeckApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        enrollDeck: builder.mutation<EnrollResponseDto, number>({
            query: (deckId) => ({
                url: `/decks/${deckId}/enroll`,
                method: 'POST',
            }),
            invalidatesTags: [{ type: 'LearningDeck', id: 'LIST' }],
        }),
    }),
})

export const { useEnrollDeckMutation } = enrollDeckApi
