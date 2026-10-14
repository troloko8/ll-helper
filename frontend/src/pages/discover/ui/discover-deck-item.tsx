import { Link } from 'react-router-dom'
import {
    getDeckLanguageLabel,
    type PublicDeckListResponseDto,
} from '@/entities/deck'
import styles from './discover-deck-item.module.css'

function OwnerAvatar({ deck }: { deck: PublicDeckListResponseDto }) {
    if (deck.owner.avatarUrl)
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
    return (
        <span className={styles.avatarFallback} aria-hidden="true">
            {deck.owner.username.slice(0, 2).toUpperCase()}
        </span>
    )
}

export function DiscoverDeckItem({
    deck,
}: {
    deck: PublicDeckListResponseDto
}) {
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
            <h2>{deck.title}</h2>
            <p
                className={styles.languages}
                aria-label={`${sourceLanguage} to ${targetLanguage}`}
            >
                {sourceLanguage}
                <span aria-hidden="true"> → </span>
                {targetLanguage}
            </p>
            <div className={styles.cardFooter}>
                <span className={styles.owner}>
                    <OwnerAvatar deck={deck} />
                    <span>@{deck.owner.username}</span>
                </span>
                <span className={styles.cardCount}>
                    {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
                </span>
            </div>
        </Link>
    )
}
