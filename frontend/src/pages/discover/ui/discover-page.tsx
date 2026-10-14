import { useCallback } from 'react'
import { useGetPublicDecksInfiniteQuery } from '@/entities/deck'
import { useDiscoverParams } from '../model/use-discover-params'
import { DiscoverControls } from './discover-controls'
import { DiscoverResults } from './discover-results'
import styles from './discover-page.module.css'

export function DiscoverPage() {
    const params = useDiscoverParams()
    const query = useGetPublicDecksInfiniteQuery(params.query)

    const decks = query.data?.pages.flatMap((page) => page.items) ?? []
    const total = query.data?.pages[0]?.totalElements ?? 0

    // TODO: After upgrading Redux Toolkit, use query.isFetchNextPageError once
    // generated React infinite-query hooks expose it in their public result type.
    const isNextPageError = query.isError && query.direction === 'forward'
    const refreshError =
        query.isError && Boolean(query.data) && !isNextPageError

    const { fetchNextPage } = query

    const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage])

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <p className={styles.eyebrow}>Community decks</p>
                <h1>Discover</h1>
                <p>Find public vocabulary decks shared by other learners.</p>
            </header>
            <DiscoverControls
                query={params.query}
                searchValue={params.searchValue}
                onSearchChange={params.setSearch}
                onParamChange={params.setParam}
            />
            <DiscoverResults
                decks={decks}
                total={total}
                hasActiveFilters={params.hasActiveFilters}
                error={query.error}
                isLoading={query.isLoading}
                isError={query.isError}
                isInitialError={query.isError && !query.data}
                isNextPageError={isNextPageError}
                isRefreshError={refreshError}
                hasNextPage={query.hasNextPage}
                isFetchingNextPage={query.isFetchingNextPage}
                onRetry={query.refetch}
                onLoadMore={loadMore}
            />
        </div>
    )
}
