import { Link } from 'react-router-dom'
import {
    getDeckLanguageLabel,
    type PublicDeckListResponseDto,
    useGetPublicDecksQuery,
} from '@/entities/deck'
import { ApiErrorPresentation, Button, Skeleton } from '@/shared/ui'
import styles from './discover-page.module.css'

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

function EmptyDiscoverState() {
    return (
        <section className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M10 3a7 7 0 1 0 4.36 12.47L19.9 21 21 19.9l-5.53-5.54A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
                </svg>
            </div>
            <h2>No public decks yet</h2>
            <p>Public decks shared by the community will appear here.</p>
        </section>
    )
}

function OwnerAvatar({ deck }: { deck: PublicDeckListResponseDto }) {
    if (deck.owner.avatarUrl) {
        return (
            <img
                className={styles.avatar}
                src={deck.owner.avatarUrl}
                alt=""
                width={28}
                height={28}
                loading="lazy"
                decoding="async"
            />
        )
    }

    return (
        <span className={styles.avatarFallback} aria-hidden="true">
            {deck.owner.username.slice(0, 2).toUpperCase()}
        </span>
    )
}

function DiscoverDeckCard({ deck }: { deck: PublicDeckListResponseDto }) {
    const sourceLanguage = getDeckLanguageLabel(deck.sourceLanguage)
    const targetLanguage = getDeckLanguageLabel(deck.targetLanguage)
    const languagePair = `${sourceLanguage} to ${targetLanguage}`
    const cardCountLabel = `${deck.cardCount} ${deck.cardCount === 1 ? 'card' : 'cards'}`

    return (
        <Link
            className={styles.deckCard}
            to={`/decks/${deck.id}`}
            aria-label={`Open ${deck.title}`}
        >
            <div className={styles.badges}>
                <span className={styles.publicBadge}>Public</span>
                {deck.isEnrolled && (
                    <span className={styles.enrolledBadge}>Enrolled</span>
                )}
            </div>
            <h2>{deck.title}</h2>
            <p className={styles.languages} aria-label={languagePair}>
                {sourceLanguage}
                <span aria-hidden="true"> → </span>
                {targetLanguage}
            </p>
            <div className={styles.cardFooter}>
                <span className={styles.owner}>
                    <OwnerAvatar deck={deck} />
                    <span>@{deck.owner.username}</span>
                </span>
                <span className={styles.cardCount}>{cardCountLabel}</span>
            </div>
        </Link>
    )
}

export function DiscoverPage() {
    const { data, error, isLoading, refetch } = useGetPublicDecksQuery()

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <p className={styles.eyebrow}>Community decks</p>
                <h1>Discover</h1>
                <p>Find public vocabulary decks shared by other learners.</p>
            </header>

            {isLoading && <DiscoverDecksSkeleton />}

            {error && (
                <ApiErrorPresentation
                    error={error}
                    mode="page"
                    title="Could not load public decks"
                    action={
                        <Button variant="secondary" onClick={() => refetch()}>
                            Try again
                        </Button>
                    }
                />
            )}

            {!error && data?.length === 0 && <EmptyDiscoverState />}

            {!error && data && data.length > 0 && (
                <section aria-labelledby="public-decks-title">
                    <h2 className={styles.sectionTitle} id="public-decks-title">
                        Public decks
                    </h2>
                    <div className={styles.deckGrid}>
                        {data.map((deck) => (
                            <DiscoverDeckCard deck={deck} key={deck.id} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
