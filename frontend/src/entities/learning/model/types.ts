export type LanguageCode =
    | 'EN'
    | 'RU'
    | 'DE'
    | 'FR'
    | 'ES'
    | 'IT'
    | 'PT'
    | 'ZH'
    | 'JA'
    | 'KO'
    | 'AR'
    | 'PL'
    | 'UK'
    | 'NL'
    | 'SV'
    | 'NO'
    | 'DA'
    | 'FI'
    | 'TR'
    | 'HE'

export interface LearningProgressSummaryDto {
    masteredCount: number
    totalCount: number
}

export interface LearningDeckResponseDto {
    deckId: number
    title: string
    sourceLanguage: LanguageCode
    targetLanguage: LanguageCode
    enrolledAt: string
    lastStudiedAt: string | null
    progress: LearningProgressSummaryDto
}
