import type { CardResponseDto } from '@/entities/card'
import { BulkGenerationInput } from './bulk-generation-input'
import { BulkGenerationPending } from './bulk-generation-pending'
import { BulkGenerationResult } from './bulk-generation-result'
import { useBulkGeneration } from '../model/use-bulk-generation'

export interface BulkGenerateCardsPanelProps {
    deckId: number
    sourceLanguageLabel: string
    targetLanguageLabel: string
    onViewCard: (card: CardResponseDto) => void
    onEditCard: (card: CardResponseDto) => void
    onBackToDeck: () => void
}

export function BulkGenerateCardsPanel({
    deckId,
    sourceLanguageLabel,
    targetLanguageLabel,
    onViewCard,
    onEditCard,
    onBackToDeck,
}: BulkGenerateCardsPanelProps) {
    const bulkGeneration = useBulkGeneration(deckId)
    const submittedTitleEntries = bulkGeneration.submittedTitles.map(
        (title, sourceLineIndex) => ({
            title,
            lineIndex: sourceLineIndex,
        }),
    )

    if (bulkGeneration.phase === 'generating') {
        return <BulkGenerationPending entries={submittedTitleEntries} />
    }

    if (bulkGeneration.phase === 'result' && bulkGeneration.result) {
        const bulkGenerationResult = bulkGeneration.result

        return (
            <BulkGenerationResult
                submittedCount={bulkGeneration.submittedTitles.length}
                result={bulkGenerationResult}
                onViewCard={onViewCard}
                onEditCard={onEditCard}
                onGenerateMore={bulkGeneration.startAnotherBatch}
                onBackToDeck={onBackToDeck}
            />
        )
    }

    return (
        <BulkGenerationInput
            draft={bulkGeneration.draft}
            parsed={bulkGeneration.parsed}
            sourceLanguageLabel={sourceLanguageLabel}
            targetLanguageLabel={targetLanguageLabel}
            validationError={bulkGeneration.validationError}
            requestError={bulkGeneration.requestError}
            onDraftChange={bulkGeneration.updateDraft}
            onRemoveEntry={bulkGeneration.removeEntry}
            onClear={bulkGeneration.clear}
            onGenerate={() => void bulkGeneration.generate()}
        />
    )
}
