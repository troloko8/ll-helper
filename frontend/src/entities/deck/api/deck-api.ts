import { baseApi } from '@/shared/api'
import type { DeckResponseDto, OwnedDeckListResponseDto } from '../model/types'

export const deckApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDeckById: builder.query<DeckResponseDto, number>({
            query: (deckId) => `/decks/${deckId}`,
            providesTags: (_result, _error, deckId) => [
                { type: 'Deck', id: deckId },
            ],
        }),
        getOwnedDecks: builder.query<OwnedDeckListResponseDto[], void>({
            query: () => '/decks/mine',
            providesTags: (result) => [
                { type: 'Deck', id: 'LIST' },
                ...(result?.map(({ id }) => ({ type: 'Deck' as const, id })) ??
                    []),
            ],
        }),
    }),
})

export const { useGetDeckByIdQuery, useGetOwnedDecksQuery } = deckApi
