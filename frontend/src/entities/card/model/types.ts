export interface CardResponseDto {
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
