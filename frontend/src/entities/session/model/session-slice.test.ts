import { describe, expect, it } from 'vitest'
import {
    sessionAuthenticated,
    sessionBootstrapFailed,
    sessionCleared,
    sessionInitializing,
    sessionNeedsProfile,
    sessionReducer,
    userScopedStateReset,
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

    it('returns to initializing when bootstrap is retried', () => {
        const state = sessionReducer(
            { status: 'bootstrapError' },
            sessionInitializing(),
        )
        expect(state.status).toBe('initializing')
    })

    it('transitions to bootstrapError when session verification fails', () => {
        const state = sessionReducer(undefined, sessionBootstrapFailed())
        expect(state.status).toBe('bootstrapError')
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

    it('keeps the session status when user-scoped state is reset', () => {
        const state = sessionReducer(
            { status: 'authenticated' },
            userScopedStateReset(),
        )
        expect(state.status).toBe('authenticated')
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
        expect(
            selectIsAuthenticated({ session: { status: 'bootstrapError' } }),
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
        expect(
            selectNeedsProfile({ session: { status: 'bootstrapError' } }),
        ).toBe(false)
    })
})
