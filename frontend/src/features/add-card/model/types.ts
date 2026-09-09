export interface AddCardRequestDto {
    title: string
    definition: string | null
    synonyms: string[] | null
    examples: string[] | null
    translation: string | null
    deckId: number
    autoGenerate: boolean
}
