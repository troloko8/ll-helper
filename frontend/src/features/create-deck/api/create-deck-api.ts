import type { DeckRequestDto, DeckResponseDto } from '@/entities/deck'
import { baseApi } from '@/shared/api'

export const createDeckApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createDeck: builder.mutation<DeckResponseDto, DeckRequestDto>({
            query: (body) => ({
                url: '/decks',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result) =>
                result ? [{ type: 'Deck', id: 'LIST' }] : [],
        }),
    }),
})

export const { useCreateDeckMutation } = createDeckApi
