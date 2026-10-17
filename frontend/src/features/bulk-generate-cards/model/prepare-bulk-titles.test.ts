import { describe, expect, it } from 'vitest'
import { prepareBulkTitles } from './prepare-bulk-titles'

describe('prepareBulkTitles', () => {
    it('trims titles, ignores blanks, and removes duplicate entries', () => {
        expect(
            prepareBulkTitles('  Ephemeral  \n\nluminous\nEPHEMERAL'),
        ).toEqual({
            entries: [
                { lineIndex: 0, title: 'Ephemeral' },
                { lineIndex: 2, title: 'luminous' },
            ],
            duplicateCount: 1,
        })
    })

    it('accepts exactly one hundred unique titles', () => {
        const result = prepareBulkTitles(
            Array.from({ length: 100 }, (_, index) => `word-${index}`).join(
                '\n',
            ),
        )

        expect(result.entries).toHaveLength(100)
        expect(result.error).toBeUndefined()
    })

    it('rejects more than one hundred unique titles', () => {
        const result = prepareBulkTitles(
            Array.from({ length: 101 }, (_, index) => `word-${index}`).join(
                '\n',
            ),
        )

        expect(result.error).toBe('Add at most 100 words or phrases')
    })

    it('rejects a title longer than one hundred characters', () => {
        expect(prepareBulkTitles('a'.repeat(101)).error).toBe(
            'Each word or phrase must be at most 100 characters',
        )
    })
})
