import { CARD_LIMITS } from '@/entities/card'
import { BULK_MAX_TITLES, type ParsedBulkTitles } from './types'

export function prepareBulkTitles(text: string): ParsedBulkTitles {
    const entries: ParsedBulkTitles['entries'] = []
    const seen = new Set<string>()
    let duplicateCount = 0

    text.split(/\r?\n/).forEach((line, lineIndex) => {
        const title = line.trim()

        if (!title) {
            return
        }

        const duplicateKey = title.toLowerCase()

        if (seen.has(duplicateKey)) {
            duplicateCount += 1
            return
        }

        seen.add(duplicateKey)
        entries.push({ lineIndex, title })
    })

    if (entries.length > BULK_MAX_TITLES) {
        return {
            entries,
            duplicateCount,
            error: `Add at most ${BULK_MAX_TITLES} words or phrases`,
        }
    }

    const tooLongEntry = entries.find(
        ({ title }) => title.length > CARD_LIMITS.TITLE_MAX_LENGTH,
    )
    if (tooLongEntry) {
        return {
            entries,
            duplicateCount,
            error: `Each word or phrase must be at most ${CARD_LIMITS.TITLE_MAX_LENGTH} characters`,
        }
    }

    return { entries, duplicateCount }
}
