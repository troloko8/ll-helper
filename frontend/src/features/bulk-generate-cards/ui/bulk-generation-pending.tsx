import type { BulkTitleEntry } from '../model/types'
import styles from './bulk-generate-cards.module.css'

interface BulkGenerationPendingProps {
    entries: BulkTitleEntry[]
}

export function BulkGenerationPending({ entries }: BulkGenerationPendingProps) {
    const entryCount = entries.length
    const cardLabel = entryCount === 1 ? 'card' : 'cards'

    return (
        <section
            className={styles.pending}
            aria-labelledby="bulk-generating-title"
            aria-busy="true"
        >
            <div className={styles.pendingBar} aria-hidden="true" />
            <div className={styles.panelHeading}>
                <div>
                    <span>Generation in progress</span>
                    <h2 id="bulk-generating-title">
                        Generating {entryCount} {cardLabel}…
                    </h2>
                </div>
                <span>
                    {entryCount} {cardLabel} submitted
                </span>
            </div>
            <p>
                Results will appear when the whole batch is ready. You can visit
                other pages and return here to see the result.
            </p>
            <details className={styles.submittedEntries}>
                <summary>View submitted entries</summary>
                <ol
                    className={`${styles.entryList} ${styles.submittedEntryList}`}
                >
                    {entries.map((entry, index) => (
                        <li key={`${entry.lineIndex}-${entry.title}`}>
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            <strong>{entry.title}</strong>
                        </li>
                    ))}
                </ol>
            </details>
        </section>
    )
}
