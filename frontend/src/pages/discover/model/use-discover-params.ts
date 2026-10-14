import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    hasActiveDiscoverFilters,
    parseDiscoverQuery,
} from '../lib/discover-params'

export type DiscoverParamName =
    | 'sourceLanguage'
    | 'targetLanguage'
    | 'enrolled'
    | 'sort'

export function useDiscoverParams() {
    const [searchParams, setSearchParams] = useSearchParams()
    const searchValue = searchParams.get('q') ?? ''
    const query = useMemo(
        () => parseDiscoverQuery(searchParams),
        [searchParams],
    )

    const setSearch = useCallback(
        (value: string) => {
            const next = new URLSearchParams(searchParams)
            if (value) next.set('q', value)
            else next.delete('q')
            setSearchParams(next, { replace: true })
        },
        [searchParams, setSearchParams],
    )

    const setParam = useCallback(
        (name: DiscoverParamName, value: string) => {
            const next = new URLSearchParams(searchParams)
            if (value) next.set(name, value)
            else next.delete(name)
            setSearchParams(next)
        },
        [searchParams, setSearchParams],
    )

    return {
        query,
        searchValue,
        hasActiveFilters: hasActiveDiscoverFilters(query),
        setSearch,
        setParam,
    }
}
