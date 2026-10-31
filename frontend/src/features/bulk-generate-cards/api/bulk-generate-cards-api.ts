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
            invalidatesTags: (result, error, { deckId }) =>
                error || !result?.created.length
                    ? []
                    : [
                          { type: 'Deck', id: deckId },
                          ...result.created.map((card) => ({
                              type: 'Card' as const,
                              id: card.id,
                          })),
                          { type: 'LearningDeck', id: deckId },
                          { type: 'LearningDeck', id: 'LIST' },
                          { type: 'LearningProgress', id: 'LIST' },
                          { type: 'LearningCards', id: deckId },
                          { type: 'StudySession', id: deckId },
                      ],
        }),
    }),
})

export const { useGenerateCardsBulkMutation } = bulkGenerateCardsApi
