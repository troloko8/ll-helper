import { Link, useParams } from 'react-router-dom'
import {
    getDeckLanguageLabel,
    type PublicDeckListResponseDto,
    useGetCreatorPublicDecksQuery,
} from '@/entities/deck'
import { useGetUserByUsernameQuery } from '@/entities/user'
import { ApiErrorPresentation, Button, PageState, Skeleton } from '@/shared/ui'
import styles from './creator-profile-page.module.css'

function CreatorProfileSkeleton() {
    return (
        <div className={styles.page} aria-busy="true" role="status">
            <section
                className={styles.profileSkeleton}
                aria-label="Loading creator profile"
            >
                <Skeleton variant="circular" width={88} height={88} />
                <div className={styles.skeletonText}>
                    <Skeleton width="38%" height={36} />
                    <Skeleton width="24%" />
                </div>
            </section>
            <section
                className={styles.deckGrid}
                aria-label="Loading public decks"
            >
                {[0, 1, 2].map((item) => (
                    <div className={styles.deckSkeleton} key={item}>
                        <Skeleton width="32%" />
                        <Skeleton width="72%" height={28} />
                        <Skeleton width="46%" />
                    </div>
                ))}
            </section>
        </div>
    )
}

function CreatorAvatar({
    username,
    avatarUrl,
}: {
    username: string
    avatarUrl: string | null
}) {
    if (avatarUrl) {
        return (
            <img
                className={styles.avatar}
                src={avatarUrl}
                alt=""
                width={88}
                height={88}
            />
        )
    }

    return (
        <span className={styles.avatarFallback} aria-hidden="true">
            {username.slice(0, 2).toUpperCase()}
        </span>
    )
}

function CreatorDeckItem({ deck }: { deck: PublicDeckListResponseDto }) {
    const sourceLanguage = getDeckLanguageLabel(deck.sourceLanguage)
    const targetLanguage = getDeckLanguageLabel(deck.targetLanguage)

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
            <h3>{deck.title}</h3>
            <p aria-label={`${sourceLanguage} to ${targetLanguage}`}>
                {sourceLanguage} <span aria-hidden="true">→</span>{' '}
                {targetLanguage}
            </p>
            <span className={styles.cardCount}>
                {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
            </span>
        </Link>
    )
}

export function CreatorProfilePage() {
    const { username: usernameParam } = useParams()
    const username = usernameParam ?? ''
    const skip = username.length === 0
    const profileQuery = useGetUserByUsernameQuery(username, { skip })
    const decksQuery = useGetCreatorPublicDecksQuery(username, { skip })

    if (skip) {
        return (
            <PageState
                variant="error"
                title="Invalid creator"
                description="This creator address is not valid."
                action={<Link to="/discover">Back to discover</Link>}
            />
        )
    }

    if (profileQuery.isLoading || decksQuery.isLoading) {
        return <CreatorProfileSkeleton />
    }

    if (profileQuery.error || !profileQuery.data) {
        return (
            <ApiErrorPresentation
                error={profileQuery.error}
                mode="page"
                title="Could not load creator profile"
                action={
                    <Button
                        variant="secondary"
                        onClick={() => profileQuery.refetch()}
                    >
                        Try again
                    </Button>
                }
            />
        )
    }

    const creator = profileQuery.data

    return (
        <div className={styles.page}>
            <section className={styles.profile} aria-labelledby="creator-name">
                <CreatorAvatar
                    username={creator.username}
                    avatarUrl={creator.avatarUrl}
                />
                <div>
                    <p className={styles.eyebrow}>Creator profile</p>
                    <h1 id="creator-name">
                        {creator.firstName} {creator.lastName}
                    </h1>
                    <p className={styles.username}>@{creator.username}</p>
                </div>
            </section>

            <section aria-labelledby="public-decks-title">
                <header className={styles.sectionHeader}>
                    <div>
                        <p className={styles.eyebrow}>Shared for learning</p>
                        <h2 id="public-decks-title">Public decks</h2>
                    </div>
                    {!decksQuery.error && decksQuery.data ? (
                        <span>{decksQuery.data.length} decks</span>
                    ) : null}
                </header>

                {decksQuery.error ? (
                    <ApiErrorPresentation
                        error={decksQuery.error}
                        mode="page"
                        title="Could not load public decks"
                        action={
                            <Button
                                variant="secondary"
                                onClick={() => decksQuery.refetch()}
                            >
                                Try again
                            </Button>
                        }
                    />
                ) : decksQuery.data?.length ? (
                    <div className={styles.deckGrid}>
                        {decksQuery.data.map((deck) => (
                            <CreatorDeckItem deck={deck} key={deck.id} />
                        ))}
                    </div>
                ) : (
                    <section className={styles.emptyState}>
                        <h3>No public decks yet</h3>
                        <p>This creator has not shared any public decks yet.</p>
                    </section>
                )}
            </section>
        </div>
    )
}
