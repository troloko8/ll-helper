import { useEffect, useRef } from 'react'
import { ApiErrorPresentation, Button, Skeleton } from '@/shared/ui'
import type { PublicDeckListResponseDto } from '@/entities/deck'
import { DiscoverDeckItem } from './discover-deck-item'
import styles from './discover-results.module.css'

// TODO(discover-results): Replace these independent request-state booleans with
// a discriminated view-state derived in the page model. Use mutually exclusive
// initial states (`loading | error | empty | ready`) and a nested ready-state
// pagination status (`idle | loading | error`) so impossible combinations cannot
// be passed to this component.
export interface DiscoverResultsProps {
    decks: PublicDeckListResponseDto[]
    total: number
    hasActiveFilters: boolean
    error: unknown
    isLoading: boolean
    isError: boolean
    isInitialError: boolean
    isNextPageError: boolean
    isRefreshError: boolean
    hasNextPage: boolean
    isFetchingNextPage: boolean
    onRetry: () => void
    onLoadMore: () => void
}

function DiscoverDecksSkeleton() {
    return (
        <section
            className={styles.deckGrid}
            aria-label="Loading public decks"
            aria-busy="true"
            role="status"
        >
            {[0, 1, 2, 3].map((item) => (
                <div className={styles.skeletonCard} key={item}>
                    <Skeleton width="34%" />
                    <Skeleton width="72%" height={28} />
                    <Skeleton width="48%" />
                    <Skeleton width="62%" />
                </div>
            ))}
        </section>
    )
}

function EmptyDiscoverState({ filtered }: { filtered: boolean }) {
    return (
        <section className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M10 3a7 7 0 1 0 4.36 12.47L19.9 21 21 19.9l-5.53-5.54A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
                </svg>
            </div>
            <h2>{filtered ? 'No matching decks' : 'No public decks yet'}</h2>
            <p>
                {filtered
                    ? 'Try changing your search or filters.'
                    : 'Public decks shared by the community will appear here.'}
            </p>
        </section>
    )
}

export function DiscoverResults({
    decks,
    total,
    hasActiveFilters,
    error,
    isLoading,
    isError,
    isInitialError,
    isNextPageError,
    isRefreshError,
    hasNextPage,
    isFetchingNextPage,
    onRetry,
    onLoadMore,
}: DiscoverResultsProps) {
    const sentinelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const sentinel = sentinelRef.current

        if (
            !sentinel ||
            !hasNextPage ||
            isFetchingNextPage ||
            isNextPageError ||
            isRefreshError ||
            typeof IntersectionObserver === 'undefined'
        )
            return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) onLoadMore()
            },
            { rootMargin: '240px' },
        )

        observer.observe(sentinel)

        return () => observer.disconnect()
    }, [
        hasNextPage,
        isFetchingNextPage,
        isNextPageError,
        isRefreshError,
        onLoadMore,
    ])

    if (isLoading) return <DiscoverDecksSkeleton />

    if (isInitialError)
        return (
            <ApiErrorPresentation
                error={error}
                mode="page"
                title="Could not load public decks"
                action={
                    <Button variant="secondary" onClick={onRetry}>
                        Try again
                    </Button>
                }
            />
        )

    if (!isError && decks.length === 0)
        return <EmptyDiscoverState filtered={hasActiveFilters} />

    if (decks.length === 0)
        return (
            <ApiErrorPresentation
                error={error}
                mode="page"
                title="Could not refresh public decks"
                action={
                    <Button variant="secondary" onClick={onRetry}>
                        Try again
                    </Button>
                }
            />
        )

    return (
        <section aria-labelledby="public-decks-title">
            <div className={styles.resultsHeading}>
                <h2 id="public-decks-title">Public decks</h2>
                <span>{total} results</span>
            </div>
            <div className={styles.deckGrid}>
                {decks.map((deck) => (
                    <DiscoverDeckItem deck={deck} key={deck.id} />
                ))}
            </div>
            {isRefreshError && (
                <div className={styles.nextState}>
                    <ApiErrorPresentation
                        error={error}
                        mode="inline"
                        title="Could not refresh public decks"
                        action={
                            <Button variant="secondary" onClick={onRetry}>
                                Try again
                            </Button>
                        }
                    />
                </div>
            )}
            <div
                ref={sentinelRef}
                className={styles.sentinel}
                aria-hidden="true"
            />
            {isFetchingNextPage && (
                <div className={styles.nextState} role="status">
                    Loading more decks…
                </div>
            )}
            {isNextPageError && (
                <div className={styles.nextState}>
                    <ApiErrorPresentation
                        error={error}
                        mode="inline"
                        title="Could not load more decks"
                        action={
                            <Button variant="secondary" onClick={onLoadMore}>
                                Try again
                            </Button>
                        }
                    />
                </div>
            )}
            <p className={styles.visuallyHidden} aria-live="polite">
                {decks.length} of {total} decks loaded
            </p>
        </section>
    )
}
