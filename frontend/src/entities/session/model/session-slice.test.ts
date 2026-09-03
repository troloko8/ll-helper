import { describe, expect, it } from 'vitest'
import {
    sessionAuthenticated,
    sessionCleared,
    sessionNeedsProfile,
    sessionReducer,
} from './session-slice'
import {
    selectIsAuthenticated,
    selectNeedsProfile,
    selectSessionStatus,
} from './selectors'

describe('sessionReducer', () => {
    it('starts in the initializing status', () => {
        const state = sessionReducer(undefined, { type: '@@INIT' })
        expect(state.status).toBe('initializing')
    })

    it('transitions to authenticated on sessionAuthenticated', () => {
        const state = sessionReducer(undefined, sessionAuthenticated())
        expect(state.status).toBe('authenticated')
    })

    it('transitions to needsProfile on sessionNeedsProfile', () => {
        const state = sessionReducer(undefined, sessionNeedsProfile())
        expect(state.status).toBe('needsProfile')
    })

    it('transitions to anonymous on sessionCleared', () => {
        const state = sessionReducer(undefined, sessionCleared())
        expect(state.status).toBe('anonymous')
    })
})

describe('session selectors', () => {
    it('selectSessionStatus returns the current status', () => {
        expect(
            selectSessionStatus({ session: { status: 'authenticated' } }),
        ).toBe('authenticated')
    })

    it('selectIsAuthenticated is true only when authenticated', () => {
        expect(
            selectIsAuthenticated({ session: { status: 'authenticated' } }),
        ).toBe(true)
        expect(
            selectIsAuthenticated({ session: { status: 'anonymous' } }),
        ).toBe(false)
        expect(
            selectIsAuthenticated({ session: { status: 'initializing' } }),
        ).toBe(false)
        expect(
            selectIsAuthenticated({ session: { status: 'needsProfile' } }),
        ).toBe(false)
    })

    it('selectNeedsProfile is true only when profile completion is required', () => {
        expect(
            selectNeedsProfile({ session: { status: 'needsProfile' } }),
        ).toBe(true)
        expect(
            selectNeedsProfile({ session: { status: 'authenticated' } }),
        ).toBe(false)
        expect(selectNeedsProfile({ session: { status: 'anonymous' } })).toBe(
            false,
        )
        expect(
            selectNeedsProfile({ session: { status: 'initializing' } }),
        ).toBe(false)
    })
})
