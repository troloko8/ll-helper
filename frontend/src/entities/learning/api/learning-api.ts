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
            providesTags: (_result, _error, deckId) => [
                { type: 'LearningCards', id: deckId },
            ],
        }),
        getStudyCards: builder.query<DeckCardResponseDto[], number>({
            query: (deckId) => `/decks/${deckId}/study/cards`,
        }),
    }),
})

export const {
    useGetLearningDecksQuery,
    useGetLearningDeckCardsQuery,
    useGetStudyCardsQuery,
} = learningApi
