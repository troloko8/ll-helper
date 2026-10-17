import { useMemo } from 'react'
import type { SerializedError } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import type { ApiError } from '@/shared/api'
import { useGenerateCardsBulkMutation } from '../api/bulk-generate-cards-api'
import {
    bulkDraftUpdated,
    bulkEntryRemoved,
    bulkGenerationFailed,
    bulkGenerationRequested,
    bulkGenerationStartedOver,
    bulkGenerationSucceeded,
    bulkValidationFailed,
    selectBulkGenerationForDeck,
    type BulkGenerationRootState,
} from './bulk-generation-slice'
import { prepareBulkTitles } from './prepare-bulk-titles'

export function useBulkGeneration(deckId: number) {
    const dispatch = useDispatch()
    const bulkGenerationState = useSelector((state: BulkGenerationRootState) =>
        selectBulkGenerationForDeck(state, deckId),
    )
    const rawTitlesText = bulkGenerationState.draft
    const [requestBulkCardGeneration] = useGenerateCardsBulkMutation()
    const preparedTitles = useMemo(
        () => prepareBulkTitles(rawTitlesText),
        [rawTitlesText],
    )

    const updateRawTitlesText = (nextRawTitlesText: string) => {
        dispatch(bulkDraftUpdated({ deckId, draft: nextRawTitlesText }))
    }

    const removeTitleEntry = (sourceLineIndex: number) => {
        dispatch(bulkEntryRemoved({ deckId, lineIndex: sourceLineIndex }))
    }

    const clearRawTitlesText = () => updateRawTitlesText('')

    const submitBulkGeneration = () => {
        if (preparedTitles.entries.length === 0) {
            dispatch(
                bulkValidationFailed({
                    deckId,
                    message: 'Add at least one word or phrase',
                }),
            )
            return
        }
        if (preparedTitles.error) {
            dispatch(
                bulkValidationFailed({
                    deckId,
                    message: preparedTitles.error,
                }),
            )
            return
        }

        const submittedTitles = preparedTitles.entries.map(({ title }) => title)
        const generationRequest = requestBulkCardGeneration({
            deckId,
            titles: submittedTitles,
        })

        dispatch(
            bulkGenerationRequested({
                deckId,
                titles: submittedTitles,
                requestId: generationRequest.requestId,
            }),
        )

        void generationRequest
            .unwrap()
            .then((generationResult) => {
                dispatch(
                    bulkGenerationSucceeded({
                        deckId,
                        requestId: generationRequest.requestId,
                        result: generationResult,
                    }),
                )
            })
            .catch((generationError: ApiError | SerializedError) => {
                dispatch(
                    bulkGenerationFailed({
                        deckId,
                        requestId: generationRequest.requestId,
                        error: generationError,
                    }),
                )
            })
    }

    const startNewBatch = () => {
        dispatch(bulkGenerationStartedOver(deckId))
    }

    return {
        ...bulkGenerationState,
        parsed: preparedTitles,
        updateDraft: updateRawTitlesText,
        removeEntry: removeTitleEntry,
        clear: clearRawTitlesText,
        generate: submitBulkGeneration,
        startAnotherBatch: startNewBatch,
    }
}
