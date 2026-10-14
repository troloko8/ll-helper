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

export interface DeckDetailsResponseDto extends DeckResponseDto {
    isEnrolled: boolean
}

export interface OwnedDeckListResponseDto {
    id: number
    title: string
    sourceLanguage: DeckLanguageCode
    targetLanguage: DeckLanguageCode
    isPublic: boolean
    cardCount: number
}

export interface PublicDeckListResponseDto {
    id: number
    title: string
    sourceLanguage: DeckLanguageCode
    targetLanguage: DeckLanguageCode
    owner: DeckOwnerResponseDto
    cardCount: number
    isEnrolled: boolean
}

export const PUBLIC_DECK_SORTS = [
    'NEWEST',
    'TITLE_ASC',
    'CARD_COUNT_DESC',
] as const

export type PublicDeckSort = (typeof PUBLIC_DECK_SORTS)[number]

export interface PublicDeckQuery {
    q?: string
    sourceLanguage?: DeckLanguageCode
    targetLanguage?: DeckLanguageCode
    enrolled?: boolean
    sort: PublicDeckSort
}

export interface PublicDeckPageResponseDto {
    items: PublicDeckListResponseDto[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    hasNext: boolean
}
