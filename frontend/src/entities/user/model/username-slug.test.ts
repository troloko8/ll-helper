import { describe, expect, it } from 'vitest'
import { isUsernameSlug, normalizeUsername } from './username-slug'

describe('usernameSlug', () => {
    it('normalizes surrounding whitespace and casing', () => {
        expect(normalizeUsername('  Polyglot-Reader_2  ')).toBe(
            'polyglot-reader_2',
        )
    })

    it.each(['ab', '-reader', 'reader-', 'reader.name', 'reader+name'])(
        'rejects non-canonical slug %s',
        (username) => {
            expect(isUsernameSlug(username)).toBe(false)
        },
    )
})
