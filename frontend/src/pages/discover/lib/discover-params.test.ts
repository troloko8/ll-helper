import { describe, expect, it } from 'vitest'
import { hasActiveDiscoverFilters, parseDiscoverQuery } from './discover-params'

describe('discover params', () => {
    it('uses API defaults when supported parameters are absent', () => {
        expect(parseDiscoverQuery(new URLSearchParams())).toEqual({
            q: undefined,
            sourceLanguage: undefined,
            targetLanguage: undefined,
            enrolled: undefined,
            sort: 'NEWEST',
        })
    })

    it('parses every supported parameter including enrolled false', () => {
        const searchParams = new URLSearchParams({
            q: 'travel',
            sourceLanguage: 'JA',
            targetLanguage: 'EN',
            enrolled: 'false',
            sort: 'CARD_COUNT_DESC',
        })

        expect(parseDiscoverQuery(searchParams)).toEqual({
            q: 'travel',
            sourceLanguage: 'JA',
            targetLanguage: 'EN',
            enrolled: false,
            sort: 'CARD_COUNT_DESC',
        })
    })

    it('ignores invalid filters and falls back to the default sort', () => {
        const searchParams = new URLSearchParams({
            sourceLanguage: 'INVALID',
            targetLanguage: 'UNKNOWN',
            enrolled: 'yes',
            sort: 'POPULAR',
        })

        expect(parseDiscoverQuery(searchParams)).toEqual({
            q: undefined,
            sourceLanguage: undefined,
            targetLanguage: undefined,
            enrolled: undefined,
            sort: 'NEWEST',
        })
    })

    it('treats search and filtering controls as active but not sorting alone', () => {
        expect(
            hasActiveDiscoverFilters({
                enrolled: false,
                sort: 'NEWEST',
            }),
        ).toBe(true)
        expect(
            hasActiveDiscoverFilters({
                q: 'travel',
                sort: 'NEWEST',
            }),
        ).toBe(true)
        expect(hasActiveDiscoverFilters({ sort: 'TITLE_ASC' })).toBe(false)
    })
})
