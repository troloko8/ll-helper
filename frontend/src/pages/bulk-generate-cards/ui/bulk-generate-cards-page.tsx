import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getDeckLanguageLabel, useGetDeckByIdQuery } from '@/entities/deck'
import { useGetCurrentUserQuery } from '@/entities/user'
import {
    BulkGenerateCardsPanel,
    bulkGenerationDiscarded,
} from '@/features/bulk-generate-cards'
import { ApiErrorPresentation, Button, PageState, Skeleton } from '@/shared/ui'
import styles from './bulk-generate-cards-page.module.css'

function BulkGenerationSkeleton() {
    return (
        <section
            className={styles.skeleton}
            aria-label="Loading bulk card generation"
            aria-busy="true"
            role="status"
        >
            <Skeleton width="28%" />
            <Skeleton width="58%" height={46} />
            <Skeleton variant="rectangular" height={72} />
            <Skeleton variant="rectangular" height={280} />
        </section>
    )
}

export function BulkGenerateCardsPage() {
    const dispatch = useDispatch()
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
    const deckIsUnavailable = Boolean(
        deckError && 'status' in deckError && deckError.status === 404,
    )
    const deckIsNotOwned = Boolean(
        deck && currentUser && deck.owner.id !== currentUser.id,
    )

    useEffect(() => {
        if (validDeckId && (deckIsUnavailable || deckIsNotOwned)) {
            dispatch(bulkGenerationDiscarded(deckId))
        }
    }, [deckId, deckIsNotOwned, deckIsUnavailable, dispatch, validDeckId])

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
        return <BulkGenerationSkeleton />
    }

    const error = deckError ?? userError
    if (error) {
        return (
            <ApiErrorPresentation
                error={error}
                mode="page"
                title="Unable to prepare bulk generation"
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
                description="Only the deck owner can generate cards."
                action={<Link to="/learning">Back to learning</Link>}
            />
        )
    }

    const managePath = `/decks/${deckId}/manage`
    const sourceLanguageLabel = getDeckLanguageLabel(deck.sourceLanguage)
    const targetLanguageLabel = getDeckLanguageLabel(deck.targetLanguage)
    const languagePair = `${sourceLanguageLabel} → ${targetLanguageLabel}`

    return (
        <div className={styles.page}>
            <Link className={styles.backLink} to={managePath}>
                <span aria-hidden="true">←</span>
                Back to {deck.title}
            </Link>

            <header className={styles.header}>
                <span>Bulk generation</span>
                <h1>Generate cards with AI</h1>
                <p>
                    Enter words or phrases in {sourceLanguageLabel}. AI will
                    generate {targetLanguageLabel} translations. Successfully
                    generated cards are saved directly to this deck.
                </p>
            </header>

            <nav
                className={styles.modeNavigation}
                aria-label="Card creation mode"
            >
                <Link to={`/decks/${deckId}/cards/new`}>Single card</Link>
                <span aria-current="page">Multiple cards</span>
            </nav>

            <aside
                className={styles.deckSummary}
                aria-label="Generation summary"
            >
                <div>
                    <span>Deck</span>
                    <strong>{deck.title}</strong>
                </div>
                <div>
                    <span>Languages</span>
                    <strong>{languagePair}</strong>
                </div>
                <p>
                    Created cards are saved directly to this deck without a
                    draft review.
                </p>
            </aside>

            <BulkGenerateCardsPanel
                deckId={deckId}
                sourceLanguageLabel={sourceLanguageLabel}
                targetLanguageLabel={targetLanguageLabel}
                onViewCard={(card) =>
                    navigate(`/decks/${deckId}/cards/${card.id}`)
                }
                onEditCard={(card) =>
                    navigate(`/decks/${deckId}/cards/${card.id}/edit`)
                }
                onBackToDeck={() => navigate(managePath)}
            />
        </div>
    )
}
