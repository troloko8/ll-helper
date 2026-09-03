import type { SessionState } from './session-slice'

export interface SessionRootState {
    session: SessionState
}

export const selectSessionStatus = (state: SessionRootState) =>
    state.session.status

export const selectIsAuthenticated = (state: SessionRootState) =>
    state.session.status === 'authenticated'

export const selectNeedsProfile = (state: SessionRootState) =>
    state.session.status === 'needsProfile'
