import { Link, useNavigate, useParams } from 'react-router-dom'
import { deckToFormValues, useGetDeckByIdQuery } from '@/entities/deck'
import { useGetCurrentUserQuery } from '@/entities/user'
import { EditDeckForm } from '@/features/edit-deck'
import { ApiErrorPresentation, Button, PageState, Skeleton } from '@/shared/ui'
import styles from './edit-deck-page.module.css'

export function EditDeckPage() {
    const navigate = useNavigate()

    const { deckId: deckParam } = useParams()

    const deckId = Number(deckParam)
    const validId = Number.isSafeInteger(deckId) && deckId > 0

    const deckQuery = useGetDeckByIdQuery(deckId, { skip: !validId })
    const userQuery = useGetCurrentUserQuery(undefined, { skip: !validId })

    if (!validId)
        return (
            <PageState
                variant="error"
                title="Invalid deck"
                description="This deck address is not valid."
                action={<Link to="/created">Back to created decks</Link>}
            />
        )

    if (deckQuery.isLoading || userQuery.isLoading)
        return (
            <section
                className={styles.panel}
                aria-label="Loading deck editor"
                role="status"
            >
                <Skeleton width="42%" height={40} />
                <Skeleton variant="rectangular" height={340} />
            </section>
        )

    const error = deckQuery.error ?? userQuery.error

    if (error)
        return (
            <ApiErrorPresentation
                error={error}
                mode="page"
                title="Unable to prepare deck editor"
                action={
                    <Button
                        variant="secondary"
                        onClick={() => {
                            void deckQuery.refetch()
                            void userQuery.refetch()
                        }}
                    >
                        Try again
                    </Button>
                }
            />
        )

    const deck = deckQuery.data
    const user = userQuery.data

    // TODO: Render an explicit fallback page when the queries succeed without data.
    if (!deck || !user) return null

    if (deck.owner.id !== user.id)
        return (
            <PageState
                variant="error"
                title="Owner access only"
                description="Only the deck owner can edit this deck."
                action={<Link to="/created">Back to created decks</Link>}
            />
        )
    const managePath = `/decks/${deckId}/manage`
    return (
        <div className={styles.page}>
            <Link className={styles.backLink} to={managePath}>
                ← Back to {deck.title}
            </Link>
            <section className={styles.panel}>
                <header>
                    <span>Deck settings</span>
                    <h1>Edit Deck</h1>
                    <p>Update your deck details and visibility.</p>
                </header>
                <EditDeckForm
                    key={deck.id}
                    deck={deck}
                    values={deckToFormValues(deck)}
                    onCancel={() => navigate(managePath)}
                    onSaved={() => navigate(managePath)}
                    onDeleted={() => navigate('/created')}
                />
            </section>
        </div>
    )
}
