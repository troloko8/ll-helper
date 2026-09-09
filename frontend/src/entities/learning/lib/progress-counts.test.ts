import { describe, expect, it } from 'vitest'
import type { DeckCardResponseDto } from '../model/types'
import { getDeckProgressCounts } from './progress-counts'

function card(
    id: number,
    status: DeckCardResponseDto['progress']['status'],
): DeckCardResponseDto {
    return {
        id,
        title: `Card ${id}`,
        definition: `Definition ${id}`,
        synonyms: [],
        examples: [],
        translation: `Translation ${id}`,
        progress: {
            status,
            timesSeen: 0,
            timesCorrect: 0,
            timesWrong: 0,
            correctStreak: 0,
        },
    }
}

describe('getDeckProgressCounts', () => {
    it('derives every status count from the returned card list', () => {
        expect(
            getDeckProgressCounts([
                card(1, 'NEW'),
                card(2, 'LEARNING'),
                card(3, 'LEARNING'),
                card(4, 'REVIEWING'),
                card(5, 'MASTERED'),
            ]),
        ).toEqual({ new: 1, learning: 2, reviewing: 1, mastered: 1 })
    })

    it('returns zero counts for an empty deck', () => {
        expect(getDeckProgressCounts([])).toEqual({
            new: 0,
            learning: 0,
            reviewing: 0,
            mastered: 0,
        })
    })
})
