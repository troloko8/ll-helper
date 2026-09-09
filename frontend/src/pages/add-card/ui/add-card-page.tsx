import { Link, useNavigate, useParams } from 'react-router-dom'
import { useGetDeckByIdQuery } from '@/entities/deck'
import { useGetCurrentUserQuery } from '@/entities/user'
import { AddCardForm } from '@/features/add-card'
import { ApiErrorPresentation, Button, PageState, Skeleton } from '@/shared/ui'
import styles from './add-card-page.module.css'

function AddCardSkeleton() {
    return (
        <section
            className={styles.skeleton}
            aria-label="Loading add card form"
            aria-busy="true"
            role="status"
        >
            <Skeleton width="24%" />
            <Skeleton width="48%" height={42} />
            <Skeleton variant="rectangular" height={56} />
            <div className={styles.skeletonColumns}>
                <Skeleton variant="rectangular" height={132} />
                <Skeleton variant="rectangular" height={132} />
            </div>
            <Skeleton variant="rectangular" height={96} />
        </section>
    )
}

export function AddCardPage() {
    const navigate = useNavigate()
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
        return <AddCardSkeleton />
    }

    const error = deckError ?? userError
    if (error) {
        return (
            <ApiErrorPresentation
                error={error}
                mode="page"
                title="Unable to prepare card form"
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
                description="Only the deck owner can add cards."
                action={<Link to="/learning">Back to learning</Link>}
            />
        )
    }

    const managePath = `/decks/${deckId}/manage`

    return (
        <div className={styles.page}>
            <Link className={styles.backLink} to={managePath}>
                <span aria-hidden="true">←</span>
                Back to {deck.title}
            </Link>

            <header className={styles.header}>
                <span>New card</span>
                <h1>Add Card</h1>
                <p>Add a word and the details you want to study.</p>
            </header>

            <AddCardForm
                deckId={deckId}
                onCancel={() => navigate(managePath)}
                onSuccess={() => navigate(managePath)}
            />
        </div>
    )
}
