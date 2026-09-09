import { Link, useParams } from 'react-router-dom'
import {
    getDeckProgressCounts,
    getLanguageLabel,
    useGetLearningDeckCardsQuery,
    useGetLearningDecksQuery,
} from '@/entities/learning'
import type {
    CardLearningStatus,
    DeckCardResponseDto,
    DeckProgressCounts,
} from '@/entities/learning'
import { ApiErrorPresentation, Button, PageState, Skeleton } from '@/shared/ui'
import styles from './learning-deck-details-page.module.css'

const STATUS_LABELS: Record<CardLearningStatus, string> = {
    NEW: 'New',
    LEARNING: 'Learning',
    REVIEWING: 'Reviewing',
    MASTERED: 'Mastered',
}

const COUNT_ITEMS: Array<{
    key: keyof DeckProgressCounts
    label: string
}> = [
    { key: 'mastered', label: 'Mastered' },
    { key: 'reviewing', label: 'Reviewing' },
    { key: 'learning', label: 'Learning' },
    { key: 'new', label: 'New' },
]

function DetailsSkeleton() {
    return (
        <div
            className={styles.skeleton}
            aria-label="Loading learning deck"
            aria-busy="true"
            role="status"
        >
            <Skeleton width="42%" />
            <Skeleton width="68%" />
            <div className={styles.skeletonGrid}>
                {[0, 1, 2, 3].map((item) => (
                    <Skeleton key={item} variant="rectangular" height={112} />
                ))}
            </div>
            <Skeleton variant="rectangular" height={260} />
        </div>
    )
}

function ProgressOverview({ cards }: { cards: DeckCardResponseDto[] }) {
    const counts = getDeckProgressCounts(cards)
    const masteryPercent =
        cards.length === 0
            ? 0
            : Math.round((counts.mastered / cards.length) * 100)

    return (
        <section className={styles.progressSection} aria-label="Deck progress">
            <div className={styles.masteryCard}>
                <span className={styles.masteryValue}>{masteryPercent}%</span>
                <span className={styles.masteryLabel}>Mastery</span>
            </div>
            <dl className={styles.countGrid}>
                {COUNT_ITEMS.map(({ key, label }) => (
                    <div className={styles.countCard} key={key}>
                        <dt>{label}</dt>
                        <dd>{counts[key]}</dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}

function CardInventory({ cards }: { cards: DeckCardResponseDto[] }) {
    return (
        <section className={styles.inventory} aria-labelledby="inventory-title">
            <div className={styles.inventoryHeading}>
                <h2 id="inventory-title">Card inventory</h2>
                <span>{cards.length} total cards</span>
            </div>
            <div className={styles.columnHeadings} aria-hidden="true">
                <span>#</span>
                <span>Front (source)</span>
                <span>Back (target)</span>
                <span>Status</span>
            </div>
            <ol className={styles.cardList}>
                {cards.map((card, index) => (
                    <li className={styles.cardRow} key={card.id}>
                        <span className={styles.cardNumber}>
                            {String(index + 1).padStart(3, '0')}
                        </span>
                        <div className={styles.cardFace}>
                            <strong>{card.title}</strong>
                            {card.definition && (
                                <small>{card.definition}</small>
                            )}
                        </div>
                        <span className={styles.translation}>
                            {card.translation}
                        </span>
                        <span
                            className={styles.status}
                            data-status={card.progress.status}
                        >
                            {STATUS_LABELS[card.progress.status]}
                        </span>
                    </li>
                ))}
            </ol>
        </section>
    )
}

export function LearningDeckDetailsPage() {
    const { deckId: deckIdParam } = useParams()
    const deckId = Number(deckIdParam)
    const validDeckId = Number.isSafeInteger(deckId) && deckId > 0
    const {
        data: cards,
        error,
        isLoading,
        refetch,
    } = useGetLearningDeckCardsQuery(deckId, { skip: !validDeckId })
    const { data: learningDecks } = useGetLearningDecksQuery(undefined, {
        skip: !validDeckId,
    })
    const deck = learningDecks?.find((item) => item.deckId === deckId)

    if (!validDeckId) {
        return (
            <PageState
                variant="error"
                title="Invalid deck"
                description="This learning deck address is not valid."
                action={<Link to="/learning">Back to learning</Link>}
            />
        )
    }

    if (isLoading) {
        return <DetailsSkeleton />
    }

    if (error) {
        return (
            <ApiErrorPresentation
                error={error}
                mode="page"
                title="Could not load this learning deck"
                action={
                    <Button variant="secondary" onClick={() => refetch()}>
                        Try again
                    </Button>
                }
            />
        )
    }

    const resolvedCards = cards ?? []
    const languagePair = deck
        ? `${getLanguageLabel(deck.sourceLanguage)} → ${getLanguageLabel(deck.targetLanguage)}`
        : null

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <nav aria-label="Breadcrumb">
                    <Link to="/learning">Learning</Link>
                    <span aria-hidden="true">/</span>
                    <span>{deck?.title ?? `Deck ${deckId}`}</span>
                </nav>
                <h1>{deck?.title ?? `Deck ${deckId}`}</h1>
                <div className={styles.metadata}>
                    {languagePair && <span>{languagePair}</span>}
                    <span>{resolvedCards.length} cards</span>
                </div>
            </header>

            <ProgressOverview cards={resolvedCards} />

            {resolvedCards.length === 0 ? (
                <section className={styles.emptyState}>
                    <h2>No cards in this deck</h2>
                    <p>
                        Cards will appear here after they are added to the
                        enrolled deck.
                    </p>
                </section>
            ) : (
                <CardInventory cards={resolvedCards} />
            )}
        </div>
    )
}
