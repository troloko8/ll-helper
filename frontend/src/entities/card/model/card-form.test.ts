import { describe, expect, it } from 'vitest'
import { cardFormSchema, cardFormValuesToRequest } from './card-form'

function cardValues(definition = '', translation = '') {
    return {
        title: 'Ephemeral',
        definition,
        translation,
        synonyms: '',
        examples: [{ value: '' }],
    }
}

describe('cardFormSchema', () => {
    it.each(['', 'A definition'])(
        'rejects missing translation even with definition %s',
        (definition) => {
            const result = cardFormSchema.safeParse(
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
            cardFormSchema.safeParse(cardValues(definition, translation))
                .success,
        ).toBe(true)
    })
})

describe('cardFormValuesToRequest', () => {
    it('maps shared form values to the Card request contract', () => {
        expect(
            cardFormValuesToRequest({
                title: 'hola',
                definition: '',
                translation: 'hello',
                synonyms: ' buenas, , saludos ',
                examples: [{ value: ' Hola, Ana. ' }, { value: ' ' }],
            }),
        ).toEqual({
            title: 'hola',
            definition: null,
            translation: 'hello',
            synonyms: ['buenas', 'saludos'],
            examples: ['Hola, Ana.'],
        })
    })

    it('maps empty optional collections to null', () => {
        expect(
            cardFormValuesToRequest({
                title: 'hola',
                definition: 'A greeting',
                translation: 'hello',
                synonyms: '',
                examples: [{ value: '' }],
            }),
        ).toMatchObject({
            definition: 'A greeting',
            synonyms: null,
            examples: null,
        })
    })
})
