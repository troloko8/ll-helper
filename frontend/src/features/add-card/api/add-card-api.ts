import type { CardResponseDto } from '@/entities/card'
import { baseApi } from '@/shared/api'
import type { AddCardRequestDto } from '../model/types'

export const addCardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        addCard: builder.mutation<CardResponseDto, AddCardRequestDto>({
            query: (body) => ({
                url: '/cards',
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _error, { deckId }) => [
                { type: 'Deck', id: deckId },
            ],
        }),
    }),
})

export const { useAddCardMutation } = addCardApi
