import type { DeckResponseDto } from '@/entities/deck'
import { baseApi } from '@/shared/api'
import type { CreateDeckRequestDto } from '../model/types'

export const createDeckApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createDeck: builder.mutation<DeckResponseDto, CreateDeckRequestDto>({
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
