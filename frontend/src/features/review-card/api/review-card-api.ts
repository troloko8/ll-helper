import type { CardReviewResponseDto } from '@/entities/learning'
import { baseApi } from '@/shared/api'
import type { ReviewCardRequest } from '../model/types'

export const reviewCardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        reviewCard: builder.mutation<CardReviewResponseDto, ReviewCardRequest>({
            query: ({ cardId, userAnswer }) => ({
                url: `/cards/${cardId}/review`,
                method: 'POST',
                body: { userAnswer },
            }),
            invalidatesTags: (_result, _error, { deckId }) => [
                { type: 'LearningCards', id: deckId },
                { type: 'LearningDeck', id: 'LIST' },
            ],
        }),
    }),
})

export const { useReviewCardMutation } = reviewCardApi
