import { useEffect, useRef, useState } from 'react'
import type { CardResponseDto } from '@/entities/card'
import { Button } from '@/shared/ui'
import type { BulkCardGenerationResponseDto } from '../model/types'
import styles from './bulk-generate-cards.module.css'

type ResultFilter = 'all' | 'created' | 'failed'

interface BulkGenerationResultProps {
    submittedCount: number
    result: BulkCardGenerationResponseDto
    onViewCard: (card: CardResponseDto) => void
    onEditCard: (card: CardResponseDto) => void
    onGenerateMore: () => void
    onBackToDeck: () => void
}

export function BulkGenerationResult({
    submittedCount,
    result,
    onViewCard,
    onEditCard,
    onGenerateMore,
    onBackToDeck,
}: BulkGenerationResultProps) {
    const [filter, setFilter] = useState<ResultFilter>('all')
    const resultTitleRef = useRef<HTMLHeadingElement>(null)
    const createdCount = result.created.length
    const failedCount = result.failed.length
    const hasMixedResult = createdCount > 0 && failedCount > 0
    const allCreated = createdCount > 0 && failedCount === 0
    const showCreated = filter !== 'failed'
    const showFailed = filter !== 'created'
    const resultTitle =
        createdCount === 0
            ? 'No cards were created'
            : hasMixedResult
                ? `${createdCount} ${createdCount === 1 ? 'card' : 'cards'} created, ${failedCount} couldn’t be created`
                : `${createdCount} ${createdCount === 1 ? 'card' : 'cards'} created`

    useEffect(() => {
        resultTitleRef.current?.focus()
    }, [])

    return (
        <section className={styles.result} aria-labelledby="bulk-result-title">
            <header
                className={styles.resultHeader}
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                <span
                    className={`${styles.resultHeaderIcon} ${
                        allCreated
                            ? styles.resultHeaderIconSuccess
                            : hasMixedResult
                                ? styles.resultHeaderIconWarning
                                : styles.resultHeaderIconError
                    }`}
                    aria-hidden="true"
                >
                    {allCreated ? '✓' : hasMixedResult ? '!' : '×'}
                </span>
                <div>
                    <h2
                        ref={resultTitleRef}
                        id="bulk-result-title"
                        tabIndex={-1}
                    >
                        {resultTitle}
                    </h2>
                </div>
            </header>

            <div className={styles.summaryGrid}>
                <div>
                    <span>Submitted entries</span>
                    <strong>{submittedCount}</strong>
                </div>
                <div>
                    <span>Saved to deck</span>
                    <strong>{createdCount}</strong>
                </div>
                <div>
                    <span>Not created</span>
                    <strong>{failedCount}</strong>
                </div>
            </div>

            {createdCount > 0 && (
                <p className={styles.savedNotice}>
                    Created cards are already saved to the deck.
                    {failedCount > 0 && ' Failed entries were not created.'}
                </p>
            )}

            {hasMixedResult && (
                <div
                    className={styles.filters}
                    role="group"
                    aria-label="Filter generation results"
                >
                    {(['all', 'created', 'failed'] as const).map((value) => (
                        <button
                            type="button"
                            key={value}
                            aria-pressed={filter === value}
                            onClick={() => setFilter(value)}
                        >
                            {value === 'all'
                                ? `All (${submittedCount})`
                                : value === 'created'
                                    ? `Created (${createdCount})`
                                    : `Failed (${failedCount})`}
                        </button>
                    ))}
                </div>
            )}

            {showCreated && result.created.length > 0 && (
                <div className={styles.resultGroup}>
                    <div className={styles.resultGroupHeading}>
                        <h3>Created ({createdCount})</h3>
                    </div>
                    <ul className={styles.resultList}>
                        {result.created.map((card) => (
                            <li key={card.id}>
                                <strong>{card.title}</strong>
                                <span>{card.translation}</span>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => onViewCard(card)}
                                    >
                                        View
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onEditCard(card)}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {showFailed && result.failed.length > 0 && (
                <div className={styles.resultGroup}>
                    <div className={styles.resultGroupHeading}>
                        <h3>Failed ({failedCount})</h3>
                    </div>
                    <ul
                        className={`${styles.resultList} ${styles.failureList}`}
                    >
                        {result.failed.map((failure) => (
                            <li key={`${failure.inputIndex}-${failure.title}`}>
                                <strong>{failure.title}</strong>
                                <span>{failure.message}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className={styles.resultActions}>
                <Button variant="secondary" onClick={onGenerateMore}>
                    Generate more
                </Button>
                <Button onClick={onBackToDeck}>Back to deck</Button>
            </div>
        </section>
    )
}
