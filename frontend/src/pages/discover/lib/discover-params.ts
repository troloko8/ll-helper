import {
    DECK_LANGUAGE_CODES,
    type DeckLanguageCode,
    type PublicDeckQuery,
    type PublicDeckSort,
} from '@/entities/deck'

const SORTS: PublicDeckSort[] = ['NEWEST', 'TITLE_ASC', 'CARD_COUNT_DESC']

function parseLanguage(value: string | null): DeckLanguageCode | undefined {
    return DECK_LANGUAGE_CODES.find((language) => language === value)
}

function parseSort(value: string | null): PublicDeckSort {
    return SORTS.find((sort) => sort === value) ?? 'NEWEST'
}

export function parseDiscoverQuery(
    searchParams: URLSearchParams,
): PublicDeckQuery {
    const query = searchParams.get('q') ?? ''
    const enrolled = searchParams.get('enrolled')

    return {
        q: query || undefined,
        sourceLanguage: parseLanguage(searchParams.get('sourceLanguage')),
        targetLanguage: parseLanguage(searchParams.get('targetLanguage')),
        enrolled:
            enrolled === 'true'
                ? true
                : enrolled === 'false'
                  ? false
                  : undefined,
        sort: parseSort(searchParams.get('sort')),
    }
}

export function hasActiveDiscoverFilters(query: PublicDeckQuery) {
    return Boolean(
        query.q ||
        query.sourceLanguage ||
        query.targetLanguage ||
        query.enrolled !== undefined,
    )
}
