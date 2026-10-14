import { z } from 'zod'
import type { CardResponseDto } from './types'

export const CARD_LIMITS = {
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
            parseSynonyms(value).length <= CARD_LIMITS.SYNONYMS_MAX_COUNT,
        `Add at most ${CARD_LIMITS.SYNONYMS_MAX_COUNT} synonyms`,
    )
    .refine(
        (value) =>
            parseSynonyms(value).every(
                (item) => item.length <= CARD_LIMITS.SYNONYM_MAX_LENGTH,
            ),
        `Each synonym must be at most ${CARD_LIMITS.SYNONYM_MAX_LENGTH} characters`,
    )

export const cardTitleSchema = z
    .string()
    .trim()
    .min(1, 'Target word is required')
    .max(
        CARD_LIMITS.TITLE_MAX_LENGTH,
        `Target word must be at most ${CARD_LIMITS.TITLE_MAX_LENGTH} characters`,
    )

export const cardFormSchema = z.object({
    title: cardTitleSchema,
    definition: z
        .string()
        .trim()
        .max(
            CARD_LIMITS.DEFINITION_MAX_LENGTH,
            `Definition must be at most ${CARD_LIMITS.DEFINITION_MAX_LENGTH} characters`,
        ),
    translation: z
        .string()
        .trim()
        .min(1, 'Translation is required')
        .max(
            CARD_LIMITS.TRANSLATION_MAX_LENGTH,
            `Translation must be at most ${CARD_LIMITS.TRANSLATION_MAX_LENGTH} characters`,
        ),
    synonyms: synonymListSchema,
    examples: z
        .array(
            z.object({
                value: z
                    .string()
                    .trim()
                    .max(
                        CARD_LIMITS.EXAMPLE_MAX_LENGTH,
                        `Example must be at most ${CARD_LIMITS.EXAMPLE_MAX_LENGTH} characters`,
                    ),
            }),
        )
        .max(
            CARD_LIMITS.EXAMPLES_MAX_COUNT,
            `Add at most ${CARD_LIMITS.EXAMPLES_MAX_COUNT} examples`,
        ),
})

export type CardFormValues = z.infer<typeof cardFormSchema>

export interface CardRequestDto {
    title: string
    definition: string | null
    synonyms: string[] | null
    examples: string[] | null
    translation: string
}

export function parseSynonyms(value: string): string[] {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

export function parseExamples(examples: CardFormValues['examples']): string[] {
    return examples.map(({ value }) => value.trim()).filter(Boolean)
}

export function cardFormValuesToRequest(
    values: CardFormValues,
): CardRequestDto {
    const synonyms = parseSynonyms(values.synonyms)
    const examples = parseExamples(values.examples)

    return {
        title: values.title,
        definition: values.definition || null,
        translation: values.translation,
        synonyms: synonyms.length > 0 ? synonyms : null,
        examples: examples.length > 0 ? examples : null,
    }
}

export function cardToFormValues(card: CardResponseDto): CardFormValues {
    return {
        title: card.title,
        definition: card.definition ?? '',
        translation: card.translation ?? '',
        synonyms: card.synonyms?.join(', ') ?? '',
        examples:
            card.examples && card.examples.length > 0
                ? card.examples.map((value) => ({ value }))
                : [{ value: '' }],
    }
}
