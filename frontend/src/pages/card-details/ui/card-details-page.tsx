import { Link, useParams } from 'react-router-dom'
import { useGetCardByIdQuery } from '@/entities/card'
import { useGetCurrentUserQuery } from '@/entities/user'
import { ApiErrorPresentation, Button, PageState, Skeleton } from '@/shared/ui'
import styles from './card-details-page.module.css'

function CardDetailsSkeleton() {
    return (
        <section
            className={styles.panel}
            aria-label="Loading card details"
            aria-busy="true"
            role="status"
        >
            <Skeleton width="28%" />
            <Skeleton width="52%" height={42} />
            <Skeleton variant="rectangular" height={220} />
        </section>
    )
}

export function CardDetailsPage() {
    const { deckId: deckParam, cardId: cardParam } = useParams()
    const deckId = Number(deckParam)
    const cardId = Number(cardParam)
    const validIds =
        Number.isSafeInteger(deckId) &&
        deckId > 0 &&
        Number.isSafeInteger(cardId) &&
        cardId > 0
    const cardQuery = useGetCardByIdQuery(cardId, { skip: !validIds })
    const userQuery = useGetCurrentUserQuery(undefined, { skip: !validIds })

    if (!validIds)
        return (
            <PageState
                variant="error"
                title="Invalid card"
                description="This card address is not valid."
                action={<Link to="/created">Back to created decks</Link>}
            />
        )
    if (cardQuery.isLoading || userQuery.isLoading)
        return <CardDetailsSkeleton />
    const error = cardQuery.error ?? userQuery.error
    if (error)
        return (
            <ApiErrorPresentation
                error={error}
                mode="page"
                title="Unable to load card"
                action={
                    <Button
                        variant="secondary"
                        onClick={() => {
                            void cardQuery.refetch()
                            void userQuery.refetch()
                        }}
                    >
                        Try again
                    </Button>
                }
            />
        )
    const { data: card } = cardQuery
    const { data: user } = userQuery
    if (!card || !user) return null
    if (card.deckId !== deckId)
        return (
            <PageState
                variant="error"
                title="Card not found"
                description="This card does not belong to the requested deck."
                action={
                    <Link to={`/decks/${deckId}/manage`}>Back to deck</Link>
                }
            />
        )
    if (card.deckOwnerId !== user.id)
        return (
            <PageState
                variant="error"
                title="Owner access only"
                description="Only the deck owner can manage this card."
                action={<Link to="/created">Back to created decks</Link>}
            />
        )

    return (
        <div className={styles.page}>
            <Link className={styles.backLink} to={`/decks/${deckId}/manage`}>
                ← Back to deck
            </Link>
            <header className={styles.header}>
                <div>
                    <span>Card details</span>
                    <h1>{card.title}</h1>
                </div>
                <Link
                    className={styles.editLink}
                    to={`/decks/${deckId}/cards/${cardId}/edit`}
                >
                    Edit card
                </Link>
            </header>
            <section className={styles.panel}>
                <div className={styles.primaryFields}>
                    {card.definition && (
                        <div>
                            <h2>Definition</h2>
                            <p>{card.definition}</p>
                        </div>
                    )}
                    {card.translation && (
                        <div>
                            <h2>Translation</h2>
                            <p>{card.translation}</p>
                        </div>
                    )}
                </div>
                {card.synonyms && card.synonyms.length > 0 && (
                    <section>
                        <h2>Synonyms</h2>
                        <ul className={styles.tags}>
                            {card.synonyms.map((synonym) => (
                                <li key={synonym}>{synonym}</li>
                            ))}
                        </ul>
                    </section>
                )}
                {card.examples && card.examples.length > 0 && (
                    <section>
                        <h2>Usage examples</h2>
                        <ol className={styles.examples}>
                            {card.examples.map((example, index) => (
                                <li key={`${index}-${example}`}>{example}</li>
                            ))}
                        </ol>
                    </section>
                )}
            </section>
        </div>
    )
}
