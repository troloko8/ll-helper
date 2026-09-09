import { z } from 'zod'
import { DECK_LANGUAGE_CODES } from '@/entities/deck'

export const createDeckFormSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, 'Deck title is required')
        .max(100, 'Deck title must be at most 100 characters'),
    description: z
        .string()
        .trim()
        .max(500, 'Description must be at most 500 characters'),
    sourceLanguage: z.enum(DECK_LANGUAGE_CODES, {
        error: 'Select a source language',
    }),
    targetLanguage: z.enum(DECK_LANGUAGE_CODES, {
        error: 'Select a target language',
    }),
    isPrivate: z.boolean(),
})

export type CreateDeckFormValues = z.infer<typeof createDeckFormSchema>
