import { z } from 'zod'
import { DECK_LANGUAGE_CODES } from './types'
import type { DeckResponseDto } from './types'

export const deckFormSchema = z.object({
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

export type DeckFormValues = z.infer<typeof deckFormSchema>

export interface DeckRequestDto {
    title: string
    description: string
    sourceLanguage: DeckFormValues['sourceLanguage']
    targetLanguage: DeckFormValues['targetLanguage']
    isPublic: boolean
}

export function deckFormValuesToRequest(
    values: DeckFormValues,
): DeckRequestDto {
    return {
        title: values.title,
        description: values.description,
        sourceLanguage: values.sourceLanguage,
        targetLanguage: values.targetLanguage,
        isPublic: !values.isPrivate,
    }
}

export function deckToFormValues(deck: DeckResponseDto): DeckFormValues {
    return {
        title: deck.title,
        description: deck.description ?? '',
        sourceLanguage: deck.sourceLanguage,
        targetLanguage: deck.targetLanguage,
        isPrivate: !deck.isPublic,
    }
}
