import type { DeckCardResponseDto, DeckProgressCounts } from '../model/types'

export function getDeckProgressCounts(
    cards: DeckCardResponseDto[],
): DeckProgressCounts {
    return cards.reduce<DeckProgressCounts>(
        (counts, card) => {
            counts[
                card.progress.status.toLowerCase() as keyof DeckProgressCounts
            ] += 1
            return counts
        },
        { new: 0, learning: 0, reviewing: 0, mastered: 0 },
    )
}
