import { useState } from 'react'
import { ApiErrorPresentation, Button, FormField, Textarea } from '@/shared/ui'
import { BULK_MAX_TITLES, type ParsedBulkTitles } from '../model/types'
import styles from './bulk-generate-cards.module.css'

const ENTRY_PREVIEW_LIMIT = 10

interface BulkGenerationInputProps {
    draft: string
    parsed: ParsedBulkTitles
    sourceLanguageLabel: string
    targetLanguageLabel: string
    validationError?: string
    requestError?: unknown
    onDraftChange: (value: string) => void
    onRemoveEntry: (lineIndex: number) => void
    onClear: () => void
    onGenerate: () => void
}

export function BulkGenerationInput({
    draft,
    parsed,
    sourceLanguageLabel,
    targetLanguageLabel,
    validationError,
    requestError,
    onDraftChange,
    onRemoveEntry,
    onClear,
    onGenerate,
}: BulkGenerationInputProps) {
    const [showAllEntries, setShowAllEntries] = useState(false)

    const limitExceeded = parsed.entries.length > BULK_MAX_TITLES
    
    const visibleEntries = showAllEntries
        ? parsed.entries
        : parsed.entries.slice(0, ENTRY_PREVIEW_LIMIT)
    const hasCollapsedEntries = parsed.entries.length > ENTRY_PREVIEW_LIMIT

    const handleDraftChange = (value: string) => {
        setShowAllEntries(false)
        onDraftChange(value)
    }

    const handleClear = () => {
        setShowAllEntries(false)
        onClear()
    }

    return (
        <div className={styles.inputLayout}>
            <section
                className={styles.inputPanel}
                aria-labelledby="bulk-input-title"
            >
                <div className={styles.panelHeading}>
                    <div>
                        <span>Input language</span>
                        <h2 id="bulk-input-title">One entry per line</h2>
                    </div>
                    <span>Maximum {BULK_MAX_TITLES}</span>
                </div>

                {requestError !== undefined && (
                    <ApiErrorPresentation
                        error={requestError}
                        mode="inline"
                        title="Bulk generation failed"
                    />
                )}

                <FormField
                    label={`Words or phrases in ${sourceLanguageLabel}`}
                    description={`AI will generate ${targetLanguageLabel} translations. Blank lines are ignored. Duplicate entries are excluded from the request.`}
                    error={validationError ?? parsed.error}
                >
                    <Textarea
                        value={draft}
                        rows={8}
                        placeholder={'ephemeral\nluminous\nserendipity'}
                        onChange={(event) =>
                            handleDraftChange(event.target.value)
                        }
                    />
                </FormField>

                <div className={styles.parseStats} aria-live="polite">
                    <strong
                        className={
                            limitExceeded ? styles.limitExceeded : undefined
                        }
                    >
                        {limitExceeded
                            ? `${parsed.entries.length} / ${BULK_MAX_TITLES} entries`
                            : `${parsed.entries.length} ${parsed.entries.length === 1 ? 'entry' : 'entries'}`}
                    </strong>
                    {parsed.duplicateCount > 0 && (
                        <span>
                            {parsed.duplicateCount}{' '}
                            {parsed.duplicateCount === 1
                                ? 'duplicate'
                                : 'duplicates'}{' '}
                            removed
                        </span>
                    )}
                </div>

                <div className={styles.stickyActions}>
                    <Button
                        disabled={
                            parsed.entries.length === 0 ||
                            parsed.error !== undefined
                        }
                        onClick={onGenerate}
                    >
                        {parsed.entries.length > 0
                            ? `Generate ${parsed.entries.length} ${parsed.entries.length === 1 ? 'card' : 'cards'}`
                            : 'Generate cards'}
                    </Button>
                </div>

                <div className={styles.entriesHeading}>
                    <h3>Cards to generate ({parsed.entries.length})</h3>
                    {draft.trim() && (
                        <button type="button" onClick={handleClear}>
                            Clear all
                        </button>
                    )}
                </div>

                {parsed.entries.length > 0 ? (
                    <ol id="bulk-entry-list" className={styles.entryList}>
                        {visibleEntries.map((entry, index) => (
                            <li key={`${entry.lineIndex}-${entry.title}`}>
                                <span>
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <strong>{entry.title}</strong>
                                <button
                                    type="button"
                                    className={styles.removeEntryButton}
                                    aria-label={`Remove ${entry.title}`}
                                    onClick={() =>
                                        onRemoveEntry(entry.lineIndex)
                                    }
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className={styles.emptyEntries}>
                        No entries parsed yet.
                    </p>
                )}

                {hasCollapsedEntries && (
                    <button
                        type="button"
                        className={styles.previewToggle}
                        aria-controls="bulk-entry-list"
                        aria-expanded={showAllEntries}
                        onClick={() => setShowAllEntries((current) => !current)}
                    >
                        {showAllEntries
                            ? 'Show less'
                            : `Show all ${parsed.entries.length}`}
                    </button>
                )}
            </section>
        </div>
    )
}
