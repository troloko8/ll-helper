import type { DeckLanguageCode } from '@/entities/deck'

export interface CreateDeckRequestDto {
    title: string
    description: string
    sourceLanguage: DeckLanguageCode
    targetLanguage: DeckLanguageCode
    isPublic: boolean
}
