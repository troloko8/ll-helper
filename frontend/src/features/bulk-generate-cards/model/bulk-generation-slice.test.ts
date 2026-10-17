import { describe, expect, it } from 'vitest'
import { sessionCleared } from '@/entities/session'
import type { BulkCardGenerationResponseDto } from './types'
import {
    bulkGenerationDiscarded,
    bulkGenerationFailed,
    bulkGenerationReducer,
    bulkGenerationRequested,
    bulkGenerationSucceeded,
    selectBulkGenerationForDeck,
} from './bulk-generation-slice'

const firstResult: BulkCardGenerationResponseDto = {
    created: [],
    failed: [
        {
            inputIndex: 0,
            title: 'Ephemeral',
            code: 'AI_GENERATION_FAILED',
            message: 'AI could not generate a valid card.',
            retryable: true,
        },
    ],
}

const secondResult: BulkCardGenerationResponseDto = {
    created: [],
    failed: [],
}

describe('bulkGenerationSlice', () => {
    it('keeps deck workflows isolated and discards only the selected deck', () => {
        let state = bulkGenerationReducer(undefined, { type: 'initial' })

        state = bulkGenerationReducer(
            state,
            bulkGenerationRequested({
                deckId: 12,
                titles: ['Ephemeral'],
                requestId: 'request-12',
            }),
        )
        state = bulkGenerationReducer(
            state,
            bulkGenerationRequested({
                deckId: 13,
                titles: ['Luminous'],
                requestId: 'request-13',
            }),
        )
        state = bulkGenerationReducer(state, bulkGenerationDiscarded(12))

        expect(state.byDeckId[12]).toBeUndefined()
        expect(
            selectBulkGenerationForDeck({ bulkGeneration: state }, 13),
        ).toMatchObject({
            phase: 'generating',
            submittedTitles: ['Luminous'],
            activeRequestId: 'request-13',
        })
    })

    it('ignores stale success and failure after a newer request starts', () => {
        let state = bulkGenerationReducer(undefined, { type: 'initial' })

        state = bulkGenerationReducer(
            state,
            bulkGenerationRequested({
                deckId: 12,
                titles: ['Ephemeral'],
                requestId: 'older-request',
            }),
        )
        state = bulkGenerationReducer(
            state,
            bulkGenerationRequested({
                deckId: 12,
                titles: ['Luminous'],
                requestId: 'newer-request',
            }),
        )
        state = bulkGenerationReducer(
            state,
            bulkGenerationSucceeded({
                deckId: 12,
                requestId: 'older-request',
                result: firstResult,
            }),
        )
        state = bulkGenerationReducer(
            state,
            bulkGenerationFailed({
                deckId: 12,
                requestId: 'older-request',
                error: { status: 503, message: 'Older request failed' },
            }),
        )

        expect(
            selectBulkGenerationForDeck({ bulkGeneration: state }, 12),
        ).toMatchObject({
            phase: 'generating',
            submittedTitles: ['Luminous'],
            activeRequestId: 'newer-request',
            result: undefined,
            requestError: undefined,
        })

        state = bulkGenerationReducer(
            state,
            bulkGenerationSucceeded({
                deckId: 12,
                requestId: 'newer-request',
                result: secondResult,
            }),
        )

        expect(
            selectBulkGenerationForDeck({ bulkGeneration: state }, 12),
        ).toMatchObject({
            phase: 'result',
            result: secondResult,
            activeRequestId: undefined,
        })
    })

    it('clears every deck workflow when the session is cleared', () => {
        let state = bulkGenerationReducer(undefined, { type: 'initial' })

        state = bulkGenerationReducer(
            state,
            bulkGenerationRequested({
                deckId: 12,
                titles: ['Ephemeral'],
                requestId: 'request-12',
            }),
        )
        state = bulkGenerationReducer(
            state,
            bulkGenerationRequested({
                deckId: 13,
                titles: ['Luminous'],
                requestId: 'request-13',
            }),
        )

        expect(bulkGenerationReducer(state, sessionCleared()).byDeckId).toEqual(
            {},
        )
    })
})
