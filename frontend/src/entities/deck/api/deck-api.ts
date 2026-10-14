import { baseApi } from '@/shared/api'
import type {
    DeckDetailsResponseDto,
    OwnedDeckListResponseDto,
    PublicDeckListResponseDto,
    PublicDeckPageResponseDto,
    PublicDeckQuery,
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
        getPublicDecks: builder.infiniteQuery<
            PublicDeckPageResponseDto,
            PublicDeckQuery,
            number
        >({
            infiniteQueryOptions: {
                initialPageParam: 0,
                getNextPageParam: (lastPage) =>
                    lastPage.hasNext ? lastPage.page + 1 : undefined,
            },
            query: ({ queryArg, pageParam }) => ({
                url: '/decks',
                params: {
                    ...queryArg,
                    page: pageParam,
                    size: 12,
                },
            }),
            providesTags: (result) => [
                { type: 'Deck', id: 'LIST' },
                ...(result?.pages.flatMap(({ items }) =>
                    items.map(({ id }) => ({ type: 'Deck' as const, id })),
                ) ?? []),
            ],
        }),
        getCreatorPublicDecks: builder.query<
            PublicDeckListResponseDto[],
            string
        >({
            query: (username) =>
                `/decks/creator/${encodeURIComponent(username)}`,
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
    useGetCreatorPublicDecksQuery,
    useGetOwnedDecksQuery,
    useGetPublicDecksInfiniteQuery,
} = deckApi
