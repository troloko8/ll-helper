import { baseApi } from '@/shared/api'
import type { CardDetailsResponseDto } from '../model/types'

export const cardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getCardById: builder.query<CardDetailsResponseDto, number>({
            query: (cardId) => `/cards/${cardId}`,
            providesTags: (_result, _error, cardId) => [
                { type: 'Card', id: cardId },
            ],
        }),
    }),
})

export const { useGetCardByIdQuery } = cardApi
