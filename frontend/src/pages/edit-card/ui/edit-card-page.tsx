import { Link, useNavigate, useParams } from 'react-router-dom'
import { cardToFormValues, useGetCardByIdQuery } from '@/entities/card'
import { useGetCurrentUserQuery } from '@/entities/user'
import { EditCardForm } from '@/features/edit-card'
import { ApiErrorPresentation, Button, PageState, Skeleton } from '@/shared/ui'
import styles from './edit-card-page.module.css'

export function EditCardPage() {
    const navigate = useNavigate()
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
        return (
            <section
                className={styles.panel}
                aria-label="Loading card editor"
                role="status"
            >
                <Skeleton width="42%" height={40} />
                <Skeleton variant="rectangular" height={360} />
            </section>
        )
    const error = cardQuery.error ?? userQuery.error
    if (error)
        return (
            <ApiErrorPresentation
                error={error}
                mode="page"
                title="Unable to prepare card editor"
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
    const card = cardQuery.data
    const user = userQuery.data
    // TODO: Render an explicit fallback page when the queries succeed without data.
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
                description="Only the deck owner can edit this card."
                action={<Link to="/created">Back to created decks</Link>}
            />
        )
    const detailsPath = `/decks/${deckId}/cards/${cardId}`
    return (
        <div className={styles.page}>
            <Link className={styles.backLink} to={detailsPath}>
                ← Back to card details
            </Link>
            <section className={styles.panel}>
                <header>
                    <span>Card editor</span>
                    <h1>Edit Card</h1>
                    <p>Update the content learners see for {card.title}.</p>
                </header>
                <EditCardForm
                    key={card.id}
                    card={card}
                    values={cardToFormValues(card)}
                    onCancel={() => navigate(detailsPath)}
                    onSaved={() => navigate(detailsPath)}
                    onDeleted={() => navigate(`/decks/${deckId}/manage`)}
                />
            </section>
        </div>
    )
}
