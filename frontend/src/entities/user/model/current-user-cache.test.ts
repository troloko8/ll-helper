import { describe, expect, it } from 'vitest'
import {
    CURRENT_USER_STALE_AFTER_MS,
    isCurrentUserStale,
} from './current-user-cache'

describe('current-user cache freshness', () => {
    const now = 10 * CURRENT_USER_STALE_AFTER_MS

    it('keeps a recently fulfilled profile fresh', () => {
        expect(
            isCurrentUserStale(now - CURRENT_USER_STALE_AFTER_MS + 1, now),
        ).toBe(false)
    })

    it('marks a profile stale at the maximum age', () => {
        expect(isCurrentUserStale(now - CURRENT_USER_STALE_AFTER_MS, now)).toBe(
            true,
        )
    })

    it('lets an unfulfilled active query perform its initial request', () => {
        expect(isCurrentUserStale(undefined, now)).toBe(false)
    })
})
