import { z } from 'zod'

export const ADD_CARD_LIMITS = {
    TITLE_MAX_LENGTH: 100,
    DEFINITION_MAX_LENGTH: 1000,
    TRANSLATION_MAX_LENGTH: 200,
    SYNONYMS_MAX_COUNT: 20,
    SYNONYM_MAX_LENGTH: 100,
    EXAMPLES_MAX_COUNT: 20,
    EXAMPLE_MAX_LENGTH: 500,
} as const

const synonymListSchema = z
    .string()
    .refine(
        (value) =>
            value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean).length <= ADD_CARD_LIMITS.SYNONYMS_MAX_COUNT,
        `Add at most ${ADD_CARD_LIMITS.SYNONYMS_MAX_COUNT} synonyms`,
    )
    .refine(
        (value) =>
            value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
                .every(
                    (item) => item.length <= ADD_CARD_LIMITS.SYNONYM_MAX_LENGTH,
                ),
        `Each synonym must be at most ${ADD_CARD_LIMITS.SYNONYM_MAX_LENGTH} characters`,
    )

export const cardTitleSchema = z
    .string()
    .trim()
    .min(1, 'Target word is required')
    .max(
        ADD_CARD_LIMITS.TITLE_MAX_LENGTH,
        `Target word must be at most ${ADD_CARD_LIMITS.TITLE_MAX_LENGTH} characters`,
    )

export const addCardFormSchema = z.object({
    title: cardTitleSchema,
    definition: z
        .string()
        .trim()
        .max(
            ADD_CARD_LIMITS.DEFINITION_MAX_LENGTH,
            `Definition must be at most ${ADD_CARD_LIMITS.DEFINITION_MAX_LENGTH} characters`,
        ),
    translation: z
        .string()
        .trim()
        .max(
            ADD_CARD_LIMITS.TRANSLATION_MAX_LENGTH,
            `Translation must be at most ${ADD_CARD_LIMITS.TRANSLATION_MAX_LENGTH} characters`,
        ),
    synonyms: synonymListSchema,
    examples: z
        .array(
            z.object({
                value: z
                    .string()
                    .trim()
                    .max(
                        ADD_CARD_LIMITS.EXAMPLE_MAX_LENGTH,
                        `Example must be at most ${ADD_CARD_LIMITS.EXAMPLE_MAX_LENGTH} characters`,
                    ),
            }),
        )
        .max(
            ADD_CARD_LIMITS.EXAMPLES_MAX_COUNT,
            `Add at most ${ADD_CARD_LIMITS.EXAMPLES_MAX_COUNT} examples`,
        ),
})

export type AddCardFormValues = z.infer<typeof addCardFormSchema>

export function parseSynonyms(value: string): string[] | null {
    const synonyms = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

    return synonyms.length > 0 ? synonyms : null
}

export function parseExamples(
    examples: AddCardFormValues['examples'],
): string[] | null {
    const values = examples.map(({ value }) => value.trim()).filter(Boolean)

    return values.length > 0 ? values : null
}
