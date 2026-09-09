import { baseApi } from '@/shared/api'
import type { LearningDeckResponseDto } from '../model/types'

export const learningApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getLearningDecks: builder.query<LearningDeckResponseDto[], void>({
            query: () => '/learning/decks',
        }),
    }),
})

export const { useGetLearningDecksQuery } = learningApi
