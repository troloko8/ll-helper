import { describe, expect, it } from 'vitest'
import { addCardFormSchema } from './add-card-form-schema'

function cardValues(definition = '', translation = '') {
    return {
        title: 'Ephemeral',
        definition,
        translation,
        synonyms: '',
        examples: [{ value: '' }],
    }
}

describe('addCardFormSchema', () => {
    it.each(['', 'A definition'])(
        'rejects missing translation even with definition %s',
        (definition) => {
            const result = addCardFormSchema.safeParse(
                cardValues(definition, '  '),
            )

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues).toContainEqual(
                    expect.objectContaining({
                        path: ['translation'],
                        message: 'Translation is required',
                    }),
                )
            }
        },
    )

    it.each([
        [
            'definition and translation',
            'Lasting for a very short time.',
            'Мимолётный',
        ],
        ['translation', '', 'Мимолётный'],
    ])('accepts a manual card with a %s', (_field, definition, translation) => {
        expect(
            addCardFormSchema.safeParse(cardValues(definition, translation))
                .success,
        ).toBe(true)
    })
})
