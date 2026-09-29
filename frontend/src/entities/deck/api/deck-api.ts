import { baseApi } from '@/shared/api'
import type {
    DeckDetailsResponseDto,
    OwnedDeckListResponseDto,
    PublicDeckListResponseDto,
} from '../model/types'

export const deckApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDeckById: builder.query<DeckDetailsResponseDto, number>({
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
        getPublicDecks: builder.query<PublicDeckListResponseDto[], void>({
            query: () => '/decks',
            providesTags: (result) => [
                { type: 'Deck', id: 'LIST' },
                ...(result?.map(({ id }) => ({ type: 'Deck' as const, id })) ??
                    []),
            ],
        }),
    }),
})

export const {
    useGetDeckByIdQuery,
    useGetOwnedDecksQuery,
    useGetPublicDecksQuery,
} = deckApi
