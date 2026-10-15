import { baseApi } from '@/shared/api'
import type {
    LearningDeckDetailsResponseDto,
    LearningDeckResponseDto,
    LearningProgressDto,
    StudySessionResponseDto,
} from '../model/types'

export const learningApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getLearningDecks: builder.query<LearningDeckResponseDto[], void>({
            query: () => '/learning/decks',
            providesTags: [{ type: 'LearningDeck', id: 'LIST' }],
        }),
        getLearningProgress: builder.query<LearningProgressDto[], void>({
            query: () => '/learning/progress',
            providesTags: [{ type: 'LearningProgress', id: 'LIST' }],
        }),
        getLearningDeck: builder.query<LearningDeckDetailsResponseDto, number>({
            query: (deckId) => `/learning/decks/${deckId}`,
            providesTags: (_result, _error, deckId) => [
                { type: 'LearningDeck', id: deckId },
                { type: 'LearningCards', id: deckId },
            ],
        }),
        getStudySession: builder.query<StudySessionResponseDto, number>({
            query: (deckId) => `/decks/${deckId}/study`,
            providesTags: (_result, _error, deckId) => [
                { type: 'StudySession', id: deckId },
            ],
        }),
    }),
})

export const {
    useGetLearningDecksQuery,
    useGetLearningProgressQuery,
    useGetLearningDeckQuery,
    useGetStudySessionQuery,
} = learningApi
