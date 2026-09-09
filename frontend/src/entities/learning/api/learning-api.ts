import { baseApi } from '@/shared/api'
import type {
    DeckCardResponseDto,
    LearningDeckResponseDto,
} from '../model/types'

export const learningApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getLearningDecks: builder.query<LearningDeckResponseDto[], void>({
            query: () => '/learning/decks',
            providesTags: [{ type: 'LearningDeck', id: 'LIST' }],
        }),
        getLearningDeckCards: builder.query<DeckCardResponseDto[], number>({
            query: (deckId) => `/decks/${deckId}/cards`,
        }),
    }),
})

export const { useGetLearningDecksQuery, useGetLearningDeckCardsQuery } =
    learningApi
