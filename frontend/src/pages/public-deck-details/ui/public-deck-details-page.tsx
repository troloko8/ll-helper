import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    getDeckLanguageLabel,
    type DeckCardResponseDto,
    useGetDeckByIdQuery,
} from '@/entities/deck'
import { EnrollDeckButton } from '@/features/enroll-deck'
import { ApiErrorPresentation, Button, PageState, Skeleton } from '@/shared/ui'
import styles from './public-deck-details-page.module.css'

function PublicDeckSkeleton() {
    return (
        <section
            className={styles.skeleton}
            aria-label="Loading public deck"
            aria-busy="true"
            role="status"
        >
            <div className={styles.skeletonHero}>
                <Skeleton width="18%" />
                <Skeleton width="58%" height={44} />
                <Skeleton width="80%" />
                <Skeleton width="42%" />
                <Skeleton variant="rectangular" width="240px" height={52} />
            </div>
            <div className={styles.skeletonInventory}>
                <Skeleton width="26%" height={28} />
                {[0, 1, 2, 3].map((item) => (
                    <Skeleton key={item} variant="rectangular" height={70} />
                ))}
            </div>
        </section>
    )
}

function PublicCardInventory({ cards }: { cards: DeckCardResponseDto[] }) {
    if (cards.length === 0) {
        return (
            <section className={styles.emptyState}>
                <h2>No cards yet</h2>
                <p>This deck does not contain any cards yet.</p>
            </section>
        )
    }

    return (
        <section className={styles.inventory} aria-labelledby="inventory-title">
            <header className={styles.inventoryHeader}>
                <h2 id="inventory-title">Card Inventory</h2>
                <span>{cards.length} total cards</span>
            </header>
            <div className={styles.columnHeadings} aria-hidden="true">
                <span>#</span>
                <span>Front</span>
                <span>Back</span>
            </div>
            <ol className={styles.cardList}>
                {cards.map((card, index) => (
                    <li className={styles.cardRow} key={card.id}>
                        <span className={styles.cardNumber}>
                            {String(index + 1).padStart(3, '0')}
                        </span>
                        <div className={styles.cardFace}>
                            <span className={styles.mobileLabel}>Front</span>
                            <strong>{card.title}</strong>
                            {card.definition && (
                                <small>{card.definition}</small>
                            )}
                        </div>
                        <div className={styles.cardFace}>
                            <span className={styles.mobileLabel}>Back</span>
                            <strong>
                                {card.translation ?? 'Not added yet'}
                            </strong>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    )
}

export function PublicDeckDetailsPage() {
    const navigate = useNavigate()
    const { deckId: deckIdParam } = useParams()
    const deckId = Number(deckIdParam)
    const validDeckId = Number.isSafeInteger(deckId) && deckId > 0
    const {
        data: deck,
        error,
        isLoading,
        refetch,
    } = useGetDeckByIdQuery(deckId, { skip: !validDeckId })

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

    if (isLoading) {
        return <PublicDeckSkeleton />
    }

    if (error) {
        return (
            <ApiErrorPresentation
                error={error}
                mode="page"
                title="Unable to load deck"
                action={
                    <Button variant="secondary" onClick={() => refetch()}>
                        Try again
                    </Button>
                }
            />
        )
    }

    if (!deck) {
        return null
    }

    if (!deck.isPublic) {
        return (
            <PageState
                variant="error"
                title="Private deck"
                description="This deck is not available for enrollment."
                action={<Link to="/learning">Back to learning</Link>}
            />
        )
    }

    const languagePair = `${getDeckLanguageLabel(deck.sourceLanguage)} → ${getDeckLanguageLabel(deck.targetLanguage)}`

    return (
        <div className={styles.page}>
            <section className={styles.hero} aria-labelledby="deck-title">
                <div className={styles.heroContent}>
                    <span className={styles.visibilityBadge}>Public</span>
                    <h1 id="deck-title">{deck.title}</h1>
                    <p className={styles.description}>
                        {deck.description || 'No description provided.'}
                    </p>

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
                            <dt>Creator</dt>
                            <dd>@{deck.owner.username}</dd>
                        </div>
                    </dl>
                </div>

                <EnrollDeckButton
                    deckId={deck.id}
                    onSuccess={() => navigate(`/learning/${deck.id}`)}
                />
            </section>

            <PublicCardInventory cards={deck.cards} />
        </div>
    )
}
