import { describe, expect, it } from 'vitest'
import { deckFormSchema, deckFormValuesToRequest } from './deck-form'

const validDeck = {
    title: 'Japanese Core 2000',
    description: 'Essential vocabulary for JLPT N3.',
    sourceLanguage: 'EN',
    targetLanguage: 'JA',
    isPrivate: false,
} as const

describe('deckFormSchema', () => {
    it('accepts values matching the backend deck contract', () => {
        expect(deckFormSchema.safeParse(validDeck).success).toBe(true)
    })

    it.each([
        ['title', ' '],
        ['title', 'x'.repeat(101)],
        ['description', 'x'.repeat(501)],
        ['sourceLanguage', ''],
        ['targetLanguage', 'INVALID'],
    ] as const)('rejects an invalid %s', (field, value) => {
        expect(
            deckFormSchema.safeParse({
                ...validDeck,
                [field]: value,
            }).success,
        ).toBe(false)
    })
})

describe('deckFormValuesToRequest', () => {
    it.each([
        [true, false],
        [false, true],
    ])('maps isPrivate=%s to isPublic=%s', (isPrivate, isPublic) => {
        expect(
            deckFormValuesToRequest({
                title: 'Spanish basics',
                description: 'Useful words',
                sourceLanguage: 'ES',
                targetLanguage: 'EN',
                isPrivate,
            }),
        ).toEqual({
            title: 'Spanish basics',
            description: 'Useful words',
            sourceLanguage: 'ES',
            targetLanguage: 'EN',
            isPublic,
        })
    })
})
