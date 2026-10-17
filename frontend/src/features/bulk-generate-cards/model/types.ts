import type { CardResponseDto } from '@/entities/card'

export const BULK_MAX_TITLES = 100

export interface BulkCardGenerateRequestDto {
    titles: string[]
    deckId: number
}

export type BulkCardGenerationFailureCode =
    | 'AI_GENERATION_FAILED'
    | 'AI_RATE_LIMITED'
    | 'INVALID_AI_TRANSLATION'

export interface BulkCardGenerationFailureDto {
    inputIndex: number
    title: string
    code: BulkCardGenerationFailureCode
    message: string
    retryable: boolean
}

export interface BulkCardGenerationResponseDto {
    created: CardResponseDto[]
    failed: BulkCardGenerationFailureDto[]
}

export interface BulkTitleEntry {
    lineIndex: number
    title: string
}

export interface ParsedBulkTitles {
    entries: BulkTitleEntry[]
    duplicateCount: number
    error?: string
}
