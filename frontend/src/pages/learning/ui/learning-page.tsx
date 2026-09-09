import { Button, ApiErrorPresentation, Skeleton } from '@/shared/ui'
import { LearningDeckCard, useGetLearningDecksQuery } from '@/entities/learning'
import styles from './learning-page.module.css'

function LearningDecksSkeleton() {
    return (
        <section
            className={styles.deckGrid}
            aria-label="Loading learning decks"
            aria-busy="true"
            role="status"
        >
            {[0, 1, 2].map((item) => (
                <div className={styles.skeletonCard} key={item}>
                    <Skeleton width="38%" />
                    <Skeleton width="64%" />
                    <Skeleton variant="rectangular" height={4} />
                </div>
            ))}
        </section>
    )
}

function EmptyLearningState() {
    return (
        <section className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M4 4.75A2.75 2.75 0 0 1 6.75 2H11v17H6.75A2.75 2.75 0 0 0 4 21.75v-17Zm16 0A2.75 2.75 0 0 0 17.25 2H13v17h4.25A2.75 2.75 0 0 1 20 21.75v-17Z" />
                </svg>
            </div>
            <h2>No learning decks yet</h2>
            <p>
                Enrolled decks will appear here with your current mastery
                progress.
            </p>
        </section>
    )
}

export function LearningPage() {
    const { data, error, isLoading, refetch } = useGetLearningDecksQuery()

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <p className={styles.eyebrow}>My decks</p>
                <h1>Learning</h1>
                <p className={styles.subtitle}>
                    Continue where you left off and track your mastery.
                </p>
            </header>

            {isLoading && <LearningDecksSkeleton />}

            {error && (
                <ApiErrorPresentation
                    error={error}
                    mode="page"
                    title="Could not load learning decks"
                    action={
                        <Button variant="secondary" onClick={() => refetch()}>
                            Try again
                        </Button>
                    }
                />
            )}

            {!error && data?.length === 0 && <EmptyLearningState />}

            {!error && data && data.length > 0 && (
                <section
                    className={styles.deckSection}
                    aria-labelledby="learning-decks-title"
                >
                    <h2 id="learning-decks-title">Learning decks</h2>
                    <div className={styles.deckGrid}>
                        {data.map((deck, index) => (
                            <LearningDeckCard
                                deck={deck}
                                featured={index === 0}
                                key={deck.deckId}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
