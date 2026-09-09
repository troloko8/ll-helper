import { z } from 'zod'

const synonymListSchema = z
    .string()
    .refine(
        (value) =>
            value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean).length <= 20,
        'Add at most 20 synonyms',
    )
    .refine(
        (value) =>
            value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
                .every((item) => item.length <= 100),
        'Each synonym must be at most 100 characters',
    )

export const cardTitleSchema = z
    .string()
    .trim()
    .min(1, 'Target word is required')
    .max(100, 'Target word must be at most 100 characters')

export const addCardFormSchema = z.object({
    title: cardTitleSchema,
    definition: z
        .string()
        .trim()
        .max(1000, 'Definition must be at most 1000 characters'),
    translation: z
        .string()
        .trim()
        .max(200, 'Translation must be at most 200 characters'),
    synonyms: synonymListSchema,
    examples: z
        .array(
            z.object({
                value: z
                    .string()
                    .trim()
                    .max(500, 'Example must be at most 500 characters'),
            }),
        )
        .max(20, 'Add at most 20 examples'),
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
