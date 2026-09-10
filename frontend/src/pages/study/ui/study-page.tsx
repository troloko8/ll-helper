import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    useGetLearningDecksQuery,
    useGetStudyCardsQuery,
    type DeckCardResponseDto,
} from '@/entities/learning'
import { ReviewCardForm, type ReviewCardResult } from '@/features/review-card'
import { ApiErrorPresentation, Button, PageState, Skeleton } from '@/shared/ui'
import styles from './study-page.module.css'

interface SessionScore {
    reviewed: number
    correct: number
}

function StudySkeleton() {
    return (
        <section
            className={styles.skeleton}
            aria-label="Loading study session"
            aria-busy="true"
            role="status"
        >
            <Skeleton width="38%" />
            <Skeleton width="24%" />
            <Skeleton variant="rectangular" height={4} />
            <Skeleton variant="rectangular" height={340} />
        </section>
    )
}

function getContextExample(card: DeckCardResponseDto): string | null {
    const example = card.examples?.find((item) => item.trim().length > 0)
    if (!example) {
        return null
    }

    const escapedTitle = card.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return example.replace(new RegExp(escapedTitle, 'gi'), '______')
}

function StudyEmptyState({ deckId }: { deckId: number }) {
    return (
        <section
            className={styles.allCaughtUp}
            aria-labelledby="caught-up-title"
        >
            <span className={styles.caughtUpIcon} aria-hidden="true">
                ✓
            </span>
            <span>Study queue</span>
            <h1 id="caught-up-title">You're all caught up</h1>
            <p>No cards are ready for review right now.</p>
            <div className={styles.stateActions}>
                <Link to="/learning">Back to learning</Link>
                <Link to={`/learning/${deckId}`}>View deck</Link>
            </div>
        </section>
    )
}

function SessionComplete({
    deckId,
    deckTitle,
    score,
    onContinue,
    isRefreshing,
}: {
    deckId: number
    deckTitle: string
    score: SessionScore
    onContinue: () => void
    isRefreshing: boolean
}) {
    const incorrect = score.reviewed - score.correct
    const accuracy =
        score.reviewed === 0
            ? 0
            : Math.round((score.correct / score.reviewed) * 100)

    return (
        <section className={styles.complete} aria-labelledby="complete-title">
            <span>{deckTitle}</span>
            <h1 id="complete-title">Session complete</h1>
            <dl className={styles.scoreGrid}>
                <div>
                    <dt>Reviewed</dt>
                    <dd>{score.reviewed}</dd>
                    <small>Total cards</small>
                </div>
                <div>
                    <dt>Correct</dt>
                    <dd>{score.correct}</dd>
                    <small>{accuracy}% accuracy</small>
                </div>
                <div>
                    <dt>Incorrect</dt>
                    <dd>{incorrect}</dd>
                    <small>Needs review</small>
                </div>
            </dl>
            <div className={styles.completeActions}>
                <Button
                    isLoading={isRefreshing}
                    loadingLabel="Loading cards"
                    onClick={onContinue}
                >
                    Continue studying
                </Button>
                <Link to={`/learning/${deckId}`}>Back to deck</Link>
            </div>
        </section>
    )
}

function ReviewResult({
    card,
    result,
    isLastCard,
    onNext,
}: {
    card: DeckCardResponseDto
    result: ReviewCardResult
    isLastCard: boolean
    onNext: () => void
}) {
    const { response, userAnswer } = result

    return (
        <section
            className={styles.result}
            data-correct={response.correct}
            aria-labelledby="result-title"
        >
            <header className={styles.resultHeader}>
                <div>
                    <span aria-hidden="true">
                        {response.correct ? '✓' : '!'}
                    </span>
                    <h2 id="result-title">
                        {response.correct ? 'Correct' : 'Incorrect'}
                    </h2>
                </div>
                <Button variant="secondary" onClick={onNext}>
                    {isLastCard ? 'Finish session' : 'Next card'}
                </Button>
            </header>

            <dl className={styles.answerSummary}>
                <div>
                    <dt>Your answer</dt>
                    <dd>{userAnswer}</dd>
                </div>
                <div>
                    <dt>Correct answer</dt>
                    <dd>{response.correctAnswer}</dd>
                </div>
            </dl>

            <div className={styles.cardDetails}>
                {card.definition && (
                    <div>
                        <span>Definition</span>
                        <p>{card.definition}</p>
                    </div>
                )}
                {card.translation && (
                    <div>
                        <span>Translation</span>
                        <p>{card.translation}</p>
                    </div>
                )}
                {card.examples?.[0] && (
                    <div>
                        <span>Example</span>
                        <p>{card.examples[0]}</p>
                    </div>
                )}
                {card.synonyms && card.synonyms.length > 0 && (
                    <div>
                        <span>Synonyms</span>
                        <p>{card.synonyms.join(' · ')}</p>
                    </div>
                )}
            </div>

            <p className={styles.resultProgress}>
                Status: {response.status.toLocaleLowerCase()} · Correct streak:{' '}
                {response.correctStreak}
            </p>
        </section>
    )
}

export function StudyPage() {
    const { deckId: deckIdParam } = useParams()
    const deckId = Number(deckIdParam)
    const validDeckId = Number.isSafeInteger(deckId) && deckId > 0
    const [cardIndex, setCardIndex] = useState(0)
    const [reviewResult, setReviewResult] = useState<ReviewCardResult>()
    const [score, setScore] = useState<SessionScore>({
        reviewed: 0,
        correct: 0,
    })
    const [sessionComplete, setSessionComplete] = useState(false)
    const {
        data: cards,
        error,
        isLoading,
        isFetching,
        refetch,
    } = useGetStudyCardsQuery(deckId, {
        skip: !validDeckId,
        refetchOnMountOrArgChange: true,
    })
    const { data: learningDecks } = useGetLearningDecksQuery(undefined, {
        skip: !validDeckId,
    })
    const deckTitle =
        learningDecks?.find((deck) => deck.deckId === deckId)?.title ??
        `Deck ${deckId}`

    if (!validDeckId) {
        return (
            <PageState
                variant="error"
                title="Invalid study deck"
                description="This study address is not valid."
                action={<Link to="/learning">Back to learning</Link>}
            />
        )
    }

    if (isLoading) {
        return <StudySkeleton />
    }

    if (error) {
        return (
            <ApiErrorPresentation
                error={error}
                mode="page"
                title="Unable to start study session"
                action={
                    <Button variant="secondary" onClick={() => refetch()}>
                        Try again
                    </Button>
                }
            />
        )
    }

    const resolvedCards = cards ?? []

    if (resolvedCards.length === 0) {
        return <StudyEmptyState deckId={deckId} />
    }

    const continueStudying = async () => {
        await refetch()
        setCardIndex(0)
        setReviewResult(undefined)
        setScore({ reviewed: 0, correct: 0 })
        setSessionComplete(false)
    }

    if (sessionComplete) {
        return (
            <SessionComplete
                deckId={deckId}
                deckTitle={deckTitle}
                score={score}
                onContinue={() => void continueStudying()}
                isRefreshing={isFetching}
            />
        )
    }

    const card = resolvedCards[cardIndex]
    const contextExample = getContextExample(card)
    const progressValue = ((cardIndex + 1) / resolvedCards.length) * 100
    const handleReviewed = (result: ReviewCardResult) => {
        setReviewResult(result)
        setScore((current) => ({
            reviewed: current.reviewed + 1,
            correct: current.correct + (result.response.correct ? 1 : 0),
        }))
    }
    const handleNext = () => {
        setReviewResult(undefined)
        if (cardIndex === resolvedCards.length - 1) {
            setSessionComplete(true)
            return
        }
        setCardIndex((current) => current + 1)
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link to={`/learning/${deckId}`} aria-label="Back to deck">
                    ←
                </Link>
                <div>
                    <h1>{deckTitle}</h1>
                    <p>
                        Session progress{' '}
                        <strong>
                            {cardIndex + 1} / {resolvedCards.length}
                        </strong>
                    </p>
                </div>
            </header>

            <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label="Study session progress"
                aria-valuemin={0}
                aria-valuemax={resolvedCards.length}
                aria-valuenow={cardIndex + 1}
            >
                <span style={{ width: `${progressValue}%` }} />
            </div>

            {reviewResult ? (
                <ReviewResult
                    card={card}
                    result={reviewResult}
                    isLastCard={cardIndex === resolvedCards.length - 1}
                    onNext={handleNext}
                />
            ) : (
                <section className={styles.studyCard} aria-label="Study card">
                    <div className={styles.prompt}>
                        <span>Definition</span>
                        <h2>
                            {card.definition ||
                                card.translation ||
                                'Recall this word'}
                        </h2>
                        {contextExample && (
                            <p>
                                <span>Context</span>“{contextExample}”
                            </p>
                        )}
                    </div>
                    <ReviewCardForm
                        key={card.id}
                        cardId={card.id}
                        deckId={deckId}
                        onReviewed={handleReviewed}
                    />
                </section>
            )}
        </div>
    )
}
