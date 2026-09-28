import { Link } from 'react-router-dom'
import {
    getDeckLanguageLabel,
    type OwnedDeckListResponseDto,
    useGetOwnedDecksQuery,
} from '@/entities/deck'
import { ApiErrorPresentation, Button, Skeleton } from '@/shared/ui'
import styles from './created-page.module.css'

function CreatedDecksSkeleton() {
    return (
        <section
            className={styles.deckGrid}
            aria-label="Loading created decks"
            aria-busy="true"
            role="status"
        >
            {[0, 1, 2].map((item) => (
                <div className={styles.skeletonCard} key={item}>
                    <Skeleton width="32%" />
                    <Skeleton width="68%" height={28} />
                    <Skeleton width="46%" />
                    <Skeleton variant="rectangular" height={44} />
                </div>
            ))}
        </section>
    )
}

function EmptyCreatedState() {
    return (
        <section className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Zm6 5V5h2v3h3v2h-3v3h-2v-3H8V8h3Zm-5 7h12v2H6v-2Z" />
                </svg>
            </div>
            <h2>No created decks yet</h2>
            <p>Create your first deck, then add cards from its owner page.</p>
        </section>
    )
}

function CreatedDeckCard({ deck }: { deck: OwnedDeckListResponseDto }) {
    const languagePair = `${getDeckLanguageLabel(deck.sourceLanguage)} to ${getDeckLanguageLabel(deck.targetLanguage)}`
    const cardCountLabel = `${deck.cardCount} ${deck.cardCount === 1 ? 'card' : 'cards'}`

    return (
        <article className={styles.deckCard}>
            <div className={styles.cardHeading}>
                <span
                    className={
                        deck.isPublic ? styles.publicBadge : styles.privateBadge
                    }
                >
                    {deck.isPublic ? 'Public' : 'Private'}
                </span>
                <h2>{deck.title}</h2>
            </div>
            <p className={styles.languages} aria-label={languagePair}>
                {getDeckLanguageLabel(deck.sourceLanguage)}
                <span aria-hidden="true"> → </span>
                {getDeckLanguageLabel(deck.targetLanguage)}
            </p>
            <div className={styles.cardFooter}>
                <span className={styles.cardCount}>{cardCountLabel}</span>
                <Link
                    className={styles.openLink}
                    to={`/decks/${deck.id}/manage`}
                    aria-label={`Open ${deck.title}`}
                >
                    Open
                </Link>
            </div>
        </article>
    )
}

export function CreatedPage() {
    const { data, error, isLoading, refetch } = useGetOwnedDecksQuery()

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <p className={styles.eyebrow}>My decks</p>
                    <h1>Created</h1>
                    <p className={styles.subtitle}>
                        Manage the decks and cards you have created.
                    </p>
                </div>
                <Link className={styles.createDeckLink} to="/decks/new">
                    Create New Deck
                </Link>
            </header>

            {isLoading && <CreatedDecksSkeleton />}

            {error && (
                <ApiErrorPresentation
                    error={error}
                    mode="page"
                    title="Could not load created decks"
                    action={
                        <Button variant="secondary" onClick={() => refetch()}>
                            Try again
                        </Button>
                    }
                />
            )}

            {!error && data?.length === 0 && <EmptyCreatedState />}

            {!error && data && data.length > 0 && (
                <section
                    className={styles.deckSection}
                    aria-labelledby="created-decks-title"
                >
                    <h2 id="created-decks-title">Your decks</h2>
                    <div className={styles.deckGrid}>
                        {data.map((deck) => (
                            <CreatedDeckCard deck={deck} key={deck.id} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
