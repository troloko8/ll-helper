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

export interface EnrollResponseDto {
    userDeckId: number
}

export type CardLearningStatus = 'NEW' | 'LEARNING' | 'REVIEWING' | 'MASTERED'

export interface CardProgressInfoDto {
    status: CardLearningStatus
    timesSeen: number
    timesCorrect: number
    timesWrong: number
    correctStreak: number
}

export interface DeckCardResponseDto {
    id: number
    title: string
    definition: string | null
    synonyms: string[] | null
    examples: string[] | null
    translation: string | null
    progress: CardProgressInfoDto
}

export interface CardReviewResponseDto {
    correct: boolean
    correctAnswer: string
    status: CardLearningStatus
    correctStreak: number
    totalCorrect: number
}

export interface DeckProgressCounts {
    new: number
    learning: number
    reviewing: number
    mastered: number
}
