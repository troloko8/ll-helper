import type { LanguageCode } from '../model/types'

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
    EN: 'English',
    RU: 'Russian',
    DE: 'German',
    FR: 'French',
    ES: 'Spanish',
    IT: 'Italian',
    PT: 'Portuguese',
    ZH: 'Chinese',
    JA: 'Japanese',
    KO: 'Korean',
    AR: 'Arabic',
    PL: 'Polish',
    UK: 'Ukrainian',
    NL: 'Dutch',
    SV: 'Swedish',
    NO: 'Norwegian',
    DA: 'Danish',
    FI: 'Finnish',
    TR: 'Turkish',
    HE: 'Hebrew',
}

export function getLanguageLabel(language: LanguageCode): string {
    return LANGUAGE_LABELS[language]
}
