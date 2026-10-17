import { baseApi } from '@/shared/api'
import type {
    BulkCardGenerateRequestDto,
    BulkCardGenerationResponseDto,
} from '../model/types'

export const bulkGenerateCardsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        generateCardsBulk: builder.mutation<
            BulkCardGenerationResponseDto,
            BulkCardGenerateRequestDto
        >({
            query: (body) => ({
                url: '/card-generations/bulk',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, _error, { deckId }) => [
                { type: 'Deck', id: deckId },
                ...(result?.created.map((card) => ({
                    type: 'Card' as const,
                    id: card.id,
                })) ?? [{ type: 'Card' as const, id: 'LIST' }]),
                { type: 'LearningDeck', id: deckId },
                { type: 'LearningProgress', id: 'LIST' },
                { type: 'LearningCards', id: deckId },
                { type: 'StudySession', id: deckId },
            ],
        }),
    }),
})

export const { useGenerateCardsBulkMutation } = bulkGenerateCardsApi
