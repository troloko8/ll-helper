import { Link } from 'react-router-dom'
import {
    useGetLearningProgressQuery,
    type LearningProgressDto,
} from '@/entities/learning'
import { ApiErrorPresentation, Button, Skeleton } from '@/shared/ui'
import styles from './progress-page.module.css'

const numberFormatter = new Intl.NumberFormat('en-US')

function formatPercentage(value: number) {
    return `${value.toFixed(1)}%`
}

function calculateMastery(mastered: number, total: number) {
    if (total === 0) {
        return 0
    }

    return Math.min(100, Math.max(0, (mastered / total) * 100))
}

function MetricIcon({
    type,
}: {
    type: 'total' | 'new' | 'learning' | 'review' | 'mastered'
}) {
    const paths = {
        total: 'M4 5h16v14H4V5Zm2 2v2h12V7H6Zm0 4v6h3v-6H6Zm5 0v6h3v-6h-3Zm5 0v6h2v-6h-2Z',
        new: 'M11 2h2v8h8v2h-8v8h-2v-8H3v-2h8V2Z',
        learning:
            'M12 3a9 9 0 0 1 8.7 6.75h-2.1A7 7 0 0 0 6.1 7.1L9 10H2V3l2.68 2.68A8.96 8.96 0 0 1 12 3Zm10 11v7l-2.68-2.68A9 9 0 0 1 3.3 14.25h2.1a7 7 0 0 0 12.5 2.65L15 14h7Z',
        review:
            'M12 2a10 10 0 1 1-7.07 2.93A9.97 9.97 0 0 1 12 2Zm0 2a8 8 0 1 0 5.66 2.34A7.98 7.98 0 0 0 12 4Zm1 3v4.59l3.2 3.2-1.41 1.42L11 12.41V7h2Z',
        mastered:
            'm12 2 2.35 2.14 3.17-.13.13 3.17L19.8 9.5 18 12.12l.77 3.08-3.08.77L14 18.65 12 21l-2-2.35-1.69-2.68-3.08-.77L6 12.12 4.2 9.5l2.15-2.32.13-3.17 3.17.13L12 2Zm-1.1 12.1 5-5-1.4-1.4-3.6 3.58-1.4-1.39-1.4 1.42 2.8 2.79Z',
    } as const

    return (
        <span className={styles.metricIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
                <path d={paths[type]} />
            </svg>
        </span>
    )
}

function ProgressSkeleton() {
    return (
        <section
            className={styles.skeletons}
            aria-label="Loading progress"
            aria-busy="true"
            role="status"
        >
            <div className={styles.summarySkeleton}>
                <Skeleton width="32%" />
                <Skeleton width="52%" />
                <Skeleton variant="rectangular" height={4} />
            </div>
            <div className={styles.metricsSkeleton}>
                {[0, 1, 2, 3, 4].map((item) => (
                    <div className={styles.metricSkeleton} key={item}>
                        <Skeleton width="52%" />
                        <Skeleton width="36%" />
                    </div>
                ))}
            </div>
            {[0, 1, 2].map((item) => (
                <div className={styles.rowSkeleton} key={item}>
                    <Skeleton width="38%" />
                    <Skeleton width="58%" />
                </div>
            ))}
        </section>
    )
}

function EmptyProgressState() {
    return (
        <section className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
                ↗
            </div>
            <h2>No learning progress yet</h2>
            <p>Enroll in a deck to start tracking your card progress here.</p>
            <Link className={styles.discoverLink} to="/discover">
                Browse public decks
            </Link>
        </section>
    )
}

function OverallMastery({ mastered, total }: { mastered: number; total: number }) {
    const percentage = calculateMastery(mastered, total)
    const formattedPercentage = formatPercentage(percentage)

    return (
        <section
            className={styles.summary}
            aria-labelledby="overall-progress-title"
        >
            <div className={styles.summaryValue}>
                <p className={styles.sectionLabel}>Overall mastery</p>
                <h2 id="overall-progress-title">{formattedPercentage}</h2>
            </div>
            <div
                className={styles.masteryRing}
                role="progressbar"
                aria-label="Overall mastery"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Number(percentage.toFixed(1))}
            >
                <svg viewBox="0 0 36 36" aria-hidden="true">
                    <path
                        className={styles.masteryRingTrack}
                        d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
                    />
                    <path
                        className={styles.masteryRingValue}
                        d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
                        pathLength="100"
                        strokeDasharray={`${percentage} 100`}
                    />
                </svg>
                <span aria-hidden="true">✓</span>
            </div>
            <div className={styles.overallProgressTrack} aria-hidden="true">
                <span style={{ width: `${percentage}%` }} />
            </div>
        </section>
    )
}

interface ProgressTotals {
    total: number
    newCount: number
    learningCount: number
    reviewingCount: number
    masteredCount: number
}

function SummaryMetrics({ totals }: { totals: ProgressTotals }) {
    const metrics = [
        {
            key: 'total',
            label: 'Total cards',
            description: 'Total Cards',
            value: totals.total,
            icon: 'total' as const,
            className: styles.totalMetric,
            percentage: null,
        },
        {
            key: 'new',
            label: 'New',
            description: 'New Cards',
            value: totals.newCount,
            icon: 'new' as const,
            className: styles.newMetric,
            percentage: calculateMastery(totals.newCount, totals.total),
        },
        {
            key: 'learning',
            label: 'Learning',
            description: 'Learning Cards',
            value: totals.learningCount,
            icon: 'learning' as const,
            className: styles.learningMetric,
            percentage: calculateMastery(totals.learningCount, totals.total),
        },
        {
            key: 'review',
            label: 'Review',
            description: 'In Review',
            value: totals.reviewingCount,
            icon: 'review' as const,
            className: styles.reviewMetric,
            percentage: calculateMastery(totals.reviewingCount, totals.total),
        },
        {
            key: 'mastered',
            label: 'Mastered',
            description: 'Mastered Cards',
            value: totals.masteredCount,
            icon: 'mastered' as const,
            className: styles.masteredMetric,
            percentage: calculateMastery(totals.masteredCount, totals.total),
        },
    ]

    return (
        <ul className={styles.metricsGrid} aria-label="Overall card distribution">
            {metrics.map((metric) => (
                <li
                    className={[styles.metricCard, metric.className].join(' ')}
                    key={metric.key}
                >
                    <div className={styles.metricHeading}>
                        <MetricIcon type={metric.icon} />
                        <span>{metric.label}</span>
                    </div>
                    <div className={styles.metricValue}>
                        <strong>{numberFormatter.format(metric.value)}</strong>
                        <span>{metric.description}</span>
                    </div>
                    {metric.percentage !== null && (
                        <div
                            className={styles.metricProgressTrack}
                            role="progressbar"
                            aria-label={`${metric.label} cards`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Number(
                                metric.percentage.toFixed(1),
                            )}
                        >
                            <span
                                style={{ width: `${metric.percentage}%` }}
                            />
                        </div>
                    )}
                </li>
            ))}
        </ul>
    )
}

function DeckProgressItem({ deck }: { deck: LearningProgressDto }) {
    const percentage = calculateMastery(
        deck.cardsByStatus.masteredCount,
        deck.totalCards,
    )

    return (
        <li className={styles.deckItem}>
            <Link
                className={styles.deckRow}
                to={`/learning/${deck.deckId}`}
            >
                <div className={styles.deckNameCell}>
                    <h3>{deck.title}</h3>
                    <span className={styles.mobilePercentage}>
                        {formatPercentage(percentage)}
                    </span>
                </div>
                <div className={styles.mobileProgressTrack} aria-hidden="true">
                    <span style={{ width: `${percentage}%` }} />
                </div>
                <span className={styles.totalCell}>
                    <small>Total</small>
                    <strong>{numberFormatter.format(deck.totalCards)}</strong>
                </span>
                <span className={styles.newCell}>
                    <small>New</small>
                    <strong>
                        {numberFormatter.format(deck.cardsByStatus.newCount)}
                    </strong>
                </span>
                <span className={styles.learningCell}>
                    <small>Learn</small>
                    <strong>
                        {numberFormatter.format(deck.cardsByStatus.learningCount)}
                    </strong>
                </span>
                <span className={styles.reviewCell}>
                    <small>Rev</small>
                    <strong>
                        {numberFormatter.format(deck.cardsByStatus.reviewingCount)}
                    </strong>
                </span>
                <span className={styles.masteredCell}>
                    <small>Mast</small>
                    <strong>
                        {numberFormatter.format(deck.cardsByStatus.masteredCount)}
                    </strong>
                </span>
                <strong className={styles.desktopPercentage}>
                    {formatPercentage(percentage)}
                </strong>
            </Link>
        </li>
    )
}

export function ProgressPage() {
    const { data, error, isLoading, refetch } = useGetLearningProgressQuery()
    
    const totals = (data ?? []).reduce<ProgressTotals>(
        (result, deck) => ({
            total: result.total + deck.totalCards,
            newCount: result.newCount + deck.cardsByStatus.newCount,
            learningCount:
                result.learningCount + deck.cardsByStatus.learningCount,
            reviewingCount:
                result.reviewingCount + deck.cardsByStatus.reviewingCount,
            masteredCount:
                result.masteredCount + deck.cardsByStatus.masteredCount,
        }),
        {
            total: 0,
            newCount: 0,
            learningCount: 0,
            reviewingCount: 0,
            masteredCount: 0,
        },
    )

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <h1>Learning Progress</h1>
                <p>
                    Overview of your current learning status and card
                    distribution.
                </p>
            </header>

            {isLoading && <ProgressSkeleton />}
            {error && (
                <ApiErrorPresentation
                    error={error}
                    mode="page"
                    title="Could not load progress"
                    action={
                        <Button variant="secondary" onClick={() => refetch()}>
                            Try again
                        </Button>
                    }
                />
            )}
            {!error && data?.length === 0 && <EmptyProgressState />}
            {!error && data && data.length > 0 && (
                <>
                    <OverallMastery
                        mastered={totals.masteredCount}
                        total={totals.total}
                    />
                    <SummaryMetrics totals={totals} />
                    <section
                        className={styles.deckSection}
                        aria-labelledby="progress-by-deck-title"
                    >
                        <h2 id="progress-by-deck-title">Progress by Deck</h2>
                        <div
                            className={styles.desktopTableHeader}
                            aria-hidden="true"
                        >
                            <span>Deck name</span>
                            <span>Total</span>
                            <span>New</span>
                            <span>Learning</span>
                            <span>Review</span>
                            <span>Mastered</span>
                            <span>Mastery %</span>
                        </div>
                        <ul className={styles.deckList}>
                            {data.map((deck) => (
                                <DeckProgressItem deck={deck} key={deck.deckId} />
                            ))}
                        </ul>
                    </section>
                </>
            )}
        </div>
    )
}
