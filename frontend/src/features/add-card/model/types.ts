export interface CardRequestDto {
    title: string
    definition: string | null
    synonyms: string[] | null
    examples: string[] | null
    translation: string
}

export interface GenerateCardRequestDto {
    title: string
    deckId: number
}
