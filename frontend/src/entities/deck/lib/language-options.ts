import type { DeckLanguageCode } from '../model/types'

export const DECK_LANGUAGE_OPTIONS: ReadonlyArray<{
    value: DeckLanguageCode
    label: string
}> = [
    { value: 'EN', label: 'English' },
    { value: 'RU', label: 'Russian' },
    { value: 'DE', label: 'German' },
    { value: 'FR', label: 'French' },
    { value: 'ES', label: 'Spanish' },
    { value: 'IT', label: 'Italian' },
    { value: 'PT', label: 'Portuguese' },
    { value: 'ZH', label: 'Chinese' },
    { value: 'JA', label: 'Japanese' },
    { value: 'KO', label: 'Korean' },
    { value: 'AR', label: 'Arabic' },
    { value: 'PL', label: 'Polish' },
    { value: 'UK', label: 'Ukrainian' },
    { value: 'NL', label: 'Dutch' },
    { value: 'SV', label: 'Swedish' },
    { value: 'NO', label: 'Norwegian' },
    { value: 'DA', label: 'Danish' },
    { value: 'FI', label: 'Finnish' },
    { value: 'TR', label: 'Turkish' },
    { value: 'HE', label: 'Hebrew' },
]
