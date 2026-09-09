export const DECK_LANGUAGE_CODES = [
    'EN',
    'RU',
    'DE',
    'FR',
    'ES',
    'IT',
    'PT',
    'ZH',
    'JA',
    'KO',
    'AR',
    'PL',
    'UK',
    'NL',
    'SV',
    'NO',
    'DA',
    'FI',
    'TR',
    'HE',
] as const

export type DeckLanguageCode = (typeof DECK_LANGUAGE_CODES)[number]

export interface DeckOwnerResponseDto {
    id: number
    username: string
    firstName: string
    lastName: string
    nativeLanguage: string
    targetLanguage: string
    avatarUrl: string | null
    uiLanguage: string
    createdAt: string
    updatedAt: string
}

export interface DeckCardResponseDto {
    id: number
    deckId: number
    title: string
    definition: string | null
    synonyms: string[] | null
    examples: string[] | null
    translation: string | null
    createdAt: string
    updatedAt: string
}

export interface DeckResponseDto {
    id: number
    title: string
    description: string | null
    sourceLanguage: DeckLanguageCode
    targetLanguage: DeckLanguageCode
    createdAt: string
    updatedAt: string
    owner: DeckOwnerResponseDto
    isPublic: boolean
    cards: DeckCardResponseDto[]
}
