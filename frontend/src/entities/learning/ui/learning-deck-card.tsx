import type { LearningDeckResponseDto } from '../model/types'
import { getLanguageLabel } from '../lib/language-labels'
import styles from './learning-deck-card.module.css'

export interface LearningDeckCardProps {
    deck: LearningDeckResponseDto
    featured?: boolean
}

export function LearningDeckCard({
    deck,
    featured = false,
}: LearningDeckCardProps) {
    const { masteredCount, totalCount } = deck.progress
    const progressPercent =
        totalCount === 0 ? 0 : Math.round((masteredCount / totalCount) * 100)
    const activityLabel = deck.lastStudiedAt
        ? 'Continue learning'
        : 'Start learning'
    const languagePair = `${getLanguageLabel(deck.sourceLanguage)} to ${getLanguageLabel(deck.targetLanguage)}`

    return (
        <article
            className={[styles.card, featured && styles.featured]
                .filter(Boolean)
                .join(' ')}
        >
            <div className={styles.headingRow}>
                <div className={styles.heading}>
                    {featured && (
                        <p className={styles.eyebrow}>{activityLabel}</p>
                    )}
                    <h3 className={styles.title}>{deck.title}</h3>
                </div>
                <span className={styles.percentage}>{progressPercent}%</span>
            </div>

            <p className={styles.languages} aria-label={languagePair}>
                {getLanguageLabel(deck.sourceLanguage)}
                <span aria-hidden="true"> → </span>
                {getLanguageLabel(deck.targetLanguage)}
            </p>

            <div className={styles.progressBlock}>
                <div className={styles.progressLabels}>
                    <span>Mastery</span>
                    <span>
                        {masteredCount} / {totalCount} mastered
                    </span>
                </div>
                <progress
                    className={styles.progress}
                    max={Math.max(totalCount, 1)}
                    value={masteredCount}
                    aria-label={`${deck.title} mastery`}
                />
            </div>
        </article>
    )
}
