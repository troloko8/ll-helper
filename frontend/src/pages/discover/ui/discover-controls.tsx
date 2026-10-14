import { useEffect, useState } from 'react'
import { Input, Select } from '@/shared/ui'
import { DECK_LANGUAGE_OPTIONS, type PublicDeckQuery } from '@/entities/deck'
import type { DiscoverParamName } from '../model/use-discover-params'
import styles from './discover-controls.module.css'

export interface DiscoverControlsProps {
    query: PublicDeckQuery
    searchValue: string
    onSearchChange: (value: string) => void
    onParamChange: (name: DiscoverParamName, value: string) => void
}

function DiscoverSearch({
    value,
    onChange,
}: {
    value: string
    onChange: (value: string) => void
}) {
    const [draftState, setDraftState] = useState(() => ({
        sourceValue: value,
        value,
    }))

    const draft = draftState.sourceValue === value ? draftState.value : value

    useEffect(() => {
        const normalized = draft.trim()

        if (normalized === value) return

        const timer = window.setTimeout(() => {
            onChange(normalized)
        }, 300)

        return () => window.clearTimeout(timer)
    }, [draft, onChange, value])

    return (
        <label className={styles.search}>
            <span>Search by deck or creator</span>
            <Input
                type="search"
                value={draft}
                maxLength={100}
                onChange={(event) =>
                    setDraftState({
                        sourceValue: value,
                        value: event.target.value,
                    })
                }
                placeholder="Search decks by title or creator..."
            />
        </label>
    )
}

export function DiscoverControls({
    query,
    searchValue,
    onSearchChange,
    onParamChange,
}: DiscoverControlsProps) {
    return (
        <section className={styles.controls} aria-label="Discover controls">
            <DiscoverSearch value={searchValue} onChange={onSearchChange} />

            <details className={styles.filters} open>
                <summary>Filters and sorting</summary>
                <div className={styles.filterGrid}>
                    <label>
                        <span>Source language</span>
                        <Select
                            value={query.sourceLanguage ?? ''}
                            onChange={(event) =>
                                onParamChange(
                                    'sourceLanguage',
                                    event.target.value,
                                )
                            }
                        >
                            <option value="">All languages</option>
                            {DECK_LANGUAGE_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </Select>
                    </label>
                    <label>
                        <span>Target language</span>
                        <Select
                            value={query.targetLanguage ?? ''}
                            onChange={(event) =>
                                onParamChange(
                                    'targetLanguage',
                                    event.target.value,
                                )
                            }
                        >
                            <option value="">All languages</option>
                            {DECK_LANGUAGE_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </Select>
                    </label>
                    <label>
                        <span>Enrollment</span>
                        <Select
                            value={
                                query.enrolled === undefined
                                    ? ''
                                    : String(query.enrolled)
                            }
                            onChange={(event) =>
                                onParamChange('enrolled', event.target.value)
                            }
                        >
                            <option value="">All decks</option>
                            <option value="true">Enrolled</option>
                            <option value="false">Not enrolled</option>
                        </Select>
                    </label>
                    <label>
                        <span>Sort by</span>
                        <Select
                            value={query.sort}
                            onChange={(event) =>
                                onParamChange(
                                    'sort',
                                    event.target.value === 'NEWEST'
                                        ? ''
                                        : event.target.value,
                                )
                            }
                        >
                            <option value="NEWEST">Newest</option>
                            <option value="TITLE_ASC">Title A–Z</option>
                            <option value="CARD_COUNT_DESC">Most cards</option>
                        </Select>
                    </label>
                </div>
            </details>
        </section>
    )
}
