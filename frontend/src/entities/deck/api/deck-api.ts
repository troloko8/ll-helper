import { baseApi } from '@/shared/api'
import type { DeckResponseDto } from '../model/types'

export const deckApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDeckById: builder.query<DeckResponseDto, number>({
            query: (deckId) => `/decks/${deckId}`,
        }),
    }),
})

export const { useGetDeckByIdQuery } = deckApi
