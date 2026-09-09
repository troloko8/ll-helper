import { describe, expect, it } from 'vitest'
import { createDeckFormSchema } from './create-deck-form-schema'

const validDeck = {
    title: 'Japanese Core 2000',
    description: 'Essential vocabulary for JLPT N3.',
    sourceLanguage: 'EN',
    targetLanguage: 'JA',
    isPrivate: false,
} as const

describe('createDeckFormSchema', () => {
    it('accepts values matching the backend deck contract', () => {
        expect(createDeckFormSchema.safeParse(validDeck).success).toBe(true)
    })

    it.each([
        ['title', ' '],
        ['title', 'x'.repeat(101)],
        ['description', 'x'.repeat(501)],
        ['sourceLanguage', ''],
        ['targetLanguage', 'INVALID'],
    ] as const)('rejects an invalid %s', (field, value) => {
        expect(
            createDeckFormSchema.safeParse({
                ...validDeck,
                [field]: value,
            }).success,
        ).toBe(false)
    })
})
