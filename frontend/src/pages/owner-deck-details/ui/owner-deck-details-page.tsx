import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    getDeckLanguageLabel,
    type DeckCardResponseDto,
    useGetDeckByIdQuery,
} from '@/entities/deck'
import { useGetCurrentUserQuery } from '@/entities/user'
import { ApiErrorPresentation, Button, PageState, Skeleton } from '@/shared/ui'
import styles from './owner-deck-details-page.module.css'

function DetailsSkeleton() {
    return (
        <section
            className={styles.skeleton}
            aria-label="Loading owner deck"
            aria-busy="true"
            role="status"
        >
            <div className={styles.skeletonSummary}>
                <Skeleton width="22%" />
                <Skeleton width="52%" height={40} />
                <Skeleton width="78%" />
                <Skeleton width="34%" />
            </div>
            <div className={styles.skeletonInventory}>
                <Skeleton width="28%" height={28} />
                {[0, 1, 2, 3].map((item) => (
                    <Skeleton key={item} variant="rectangular" height={64} />
                ))}
            </div>
        </section>
    )
}

function CardInventory({ cards }: { cards: DeckCardResponseDto[] }) {
    const [search, setSearch] = useState('')
    const normalizedSearch = search.trim().toLocaleLowerCase()
    const visibleCards = useMemo(() => {
        if (!normalizedSearch) {
            return cards
        }

        return cards.filter((card) =>
            [card.title, card.translation, card.definition].some((value) =>
                value?.toLocaleLowerCase().includes(normalizedSearch),
            ),
        )
    }, [cards, normalizedSearch])

    return (
        <section className={styles.inventory} aria-labelledby="inventory-title">
            <header className={styles.inventoryHeader}>
                <div>
                    <h2 id="inventory-title">Card Inventory</h2>
                    <span>{cards.length} total cards</span>
                </div>
                <label className={styles.search}>
                    <span className={styles.visuallyHidden}>Search cards</span>
                    <span aria-hidden="true">⌕</span>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search cards..."
                    />
                </label>
            </header>

            {cards.length === 0 ? (
                <div className={styles.emptyState}>
                    <h3>No cards yet</h3>
                    <p>Cards added to this deck will appear here.</p>
                </div>
            ) : visibleCards.length === 0 ? (
                <div className={styles.emptyState}>
                    <h3>No matching cards</h3>
                    <p>Try a different search term.</p>
                </div>
            ) : (
                <div className={styles.cardTable}>
                    <div className={styles.columnHeadings} aria-hidden="true">
                        <span>#</span>
                        <span>Front (source)</span>
                        <span>Back (target)</span>
                    </div>
                    <ol className={styles.cardList}>
                        {visibleCards.map((card, index) => (
                            <li className={styles.cardRow} key={card.id}>
                                <span className={styles.cardNumber}>
                                    {String(index + 1).padStart(3, '0')}
                                </span>
                                <div className={styles.cardFace}>
                                    <span className={styles.mobileLabel}>
                                        Front (source)
                                    </span>
                                    <strong>{card.title}</strong>
                                    {card.definition && (
                                        <small>{card.definition}</small>
                                    )}
                                </div>
                                <div className={styles.cardFace}>
                                    <span className={styles.mobileLabel}>
                                        Back (target)
                                    </span>
                                    <strong>
                                        {card.translation ?? 'Not added yet'}
                                    </strong>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </section>
    )
}

export function OwnerDeckDetailsPage() {
    const { deckId: deckIdParam } = useParams()
    const deckId = Number(deckIdParam)
    const validDeckId = Number.isSafeInteger(deckId) && deckId > 0
    const {
        data: deck,
        error: deckError,
        isLoading: isDeckLoading,
        refetch: refetchDeck,
    } = useGetDeckByIdQuery(deckId, { skip: !validDeckId })
    const {
        data: currentUser,
        error: userError,
        isLoading: isUserLoading,
        refetch: refetchUser,
    } = useGetCurrentUserQuery(undefined, { skip: !validDeckId })

    if (!validDeckId) {
        return (
            <PageState
                variant="error"
                title="Invalid deck"
                description="This deck address is not valid."
                action={<Link to="/learning">Back to learning</Link>}
            />
        )
    }

    if (isDeckLoading || isUserLoading) {
        return <DetailsSkeleton />
    }

    const error = deckError ?? userError
    if (error) {
        return (
            <ApiErrorPresentation
                error={error}
                mode="page"
                title="Unable to load deck"
                action={
                    <Button
                        variant="secondary"
                        onClick={() => {
                            void refetchDeck()
                            void refetchUser()
                        }}
                    >
                        Try again
                    </Button>
                }
            />
        )
    }

    if (!deck || !currentUser) {
        return null
    }

    if (deck.owner.id !== currentUser.id) {
        return (
            <PageState
                variant="error"
                title="Owner access only"
                description="This deck belongs to another user."
                action={<Link to="/learning">Back to learning</Link>}
            />
        )
    }

    const languagePair = `${getDeckLanguageLabel(deck.sourceLanguage)} → ${getDeckLanguageLabel(deck.targetLanguage)}`

    return (
        <div className={styles.page}>
            <section className={styles.summary} aria-labelledby="deck-title">
                <div className={styles.summaryHeading}>
                    <div>
                        <div className={styles.titleLine}>
                            <h1 id="deck-title">{deck.title}</h1>
                            <span className={styles.visibilityBadge}>
                                {deck.isPublic ? 'Public' : 'Private'}
                            </span>
                        </div>
                        <p className={styles.description}>
                            {deck.description || 'No description provided.'}
                        </p>
                    </div>
                </div>

                <dl className={styles.metadata}>
                    <div>
                        <dt>Languages</dt>
                        <dd>{languagePair}</dd>
                    </div>
                    <div>
                        <dt>Total cards</dt>
                        <dd>{deck.cards.length}</dd>
                    </div>
                    <div>
                        <dt>Owner</dt>
                        <dd>@{deck.owner.username}</dd>
                    </div>
                </dl>
            </section>

            <CardInventory cards={deck.cards} />
        </div>
    )
}
