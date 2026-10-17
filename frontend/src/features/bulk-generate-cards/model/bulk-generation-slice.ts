import {
    createSlice,
    type PayloadAction,
    type SerializedError,
} from '@reduxjs/toolkit'
import { sessionCleared } from '@/entities/session'
import type { ApiError } from '@/shared/api'
import type { BulkCardGenerationResponseDto } from './types'

export type BulkGenerationPhase = 'input' | 'generating' | 'result'

export interface DeckBulkGenerationState {
    draft: string
    phase: BulkGenerationPhase
    submittedTitles: string[]
    validationError?: string
    requestError?: ApiError | SerializedError
    result?: BulkCardGenerationResponseDto
    activeRequestId?: string
}

export interface BulkGenerationState {
    byDeckId: Record<number, DeckBulkGenerationState>
}

export interface BulkGenerationRootState {
    bulkGeneration: BulkGenerationState
}

const createInitialDeckState = (): DeckBulkGenerationState => ({
    draft: '',
    phase: 'input',
    submittedTitles: [],
})

const initialState: BulkGenerationState = {
    byDeckId: {},
}

const emptyDeckState = createInitialDeckState()

function getOrCreateDeckState(
    state: BulkGenerationState,
    deckId: number,
): DeckBulkGenerationState {
    return (state.byDeckId[deckId] ??= createInitialDeckState())
}

const bulkGenerationSlice = createSlice({
    name: 'bulkGeneration',
    initialState,
    reducers: {
        bulkDraftUpdated(
            state,
            action: PayloadAction<{ deckId: number; draft: string }>,
        ) {
            const deckState = getOrCreateDeckState(state, action.payload.deckId)

            deckState.draft = action.payload.draft
            deckState.validationError = undefined
            deckState.requestError = undefined
        },
        bulkEntryRemoved(
            state,
            action: PayloadAction<{ deckId: number; lineIndex: number }>,
        ) {
            const deckState = getOrCreateDeckState(state, action.payload.deckId)

            const lines = deckState.draft.split(/\r?\n/)
            lines.splice(action.payload.lineIndex, 1)

            deckState.draft = lines.join('\n')
            deckState.validationError = undefined
            deckState.requestError = undefined
        },
        bulkValidationFailed(
            state,
            action: PayloadAction<{ deckId: number; message: string }>,
        ) {
            const deckState = getOrCreateDeckState(state, action.payload.deckId)
            deckState.validationError = action.payload.message
        },
        bulkGenerationRequested(
            state,
            action: PayloadAction<{
                deckId: number
                titles: string[]
                requestId: string
            }>,
        ) {
            const { deckId, titles, requestId } = action.payload
            const deckState = getOrCreateDeckState(state, deckId)

            deckState.phase = 'generating'
            deckState.submittedTitles = titles
            deckState.validationError = undefined
            deckState.requestError = undefined
            deckState.result = undefined
            deckState.activeRequestId = requestId
        },
        bulkGenerationSucceeded(
            state,
            action: PayloadAction<{
                deckId: number
                requestId: string
                result: BulkCardGenerationResponseDto
            }>,
        ) {
            const { deckId, requestId, result } = action.payload
            const deckState = state.byDeckId[deckId]

            if (deckState?.activeRequestId !== requestId) {
                return
            }

            deckState.phase = 'result'
            deckState.result = result
            deckState.activeRequestId = undefined
        },
        bulkGenerationFailed(
            state,
            action: PayloadAction<{
                deckId: number
                requestId: string
                error: ApiError | SerializedError
            }>,
        ) {
            const { deckId, requestId, error } = action.payload
            const deckState = state.byDeckId[deckId]

            if (deckState?.activeRequestId !== requestId) {
                return
            }

            deckState.phase = 'input'
            deckState.requestError = error
            deckState.activeRequestId = undefined
        },
        bulkGenerationStartedOver(state, action: PayloadAction<number>) {
            state.byDeckId[action.payload] = createInitialDeckState()
        },
        bulkGenerationDiscarded(state, action: PayloadAction<number>) {
            delete state.byDeckId[action.payload]
        },
    },
    extraReducers: (builder) => {
        builder.addCase(sessionCleared, () => initialState)
    },
})

export const {
    bulkDraftUpdated,
    bulkEntryRemoved,
    bulkValidationFailed,
    bulkGenerationRequested,
    bulkGenerationSucceeded,
    bulkGenerationFailed,
    bulkGenerationStartedOver,
    bulkGenerationDiscarded,
} = bulkGenerationSlice.actions

export const bulkGenerationReducer = bulkGenerationSlice.reducer

export function selectBulkGenerationForDeck(
    state: BulkGenerationRootState,
    deckId: number,
): DeckBulkGenerationState {
    return state.bulkGeneration.byDeckId[deckId] ?? emptyDeckState
}
