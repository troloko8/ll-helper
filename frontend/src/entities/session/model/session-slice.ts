import { createSlice } from '@reduxjs/toolkit'

export type SessionStatus =
    | 'initializing'
    | 'bootstrapError'
    | 'anonymous'
    | 'needsProfile'
    | 'authenticated'

export interface SessionState {
    status: SessionStatus
}

const initialState: SessionState = {
    status: 'initializing',
}

const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        sessionInitializing(state) {
            state.status = 'initializing'
        },
        sessionBootstrapFailed(state) {
            state.status = 'bootstrapError'
        },
        sessionAuthenticated(state) {
            state.status = 'authenticated'
        },
        sessionNeedsProfile(state) {
            state.status = 'needsProfile'
        },
        sessionCleared(state) {
            state.status = 'anonymous'
        },
    },
})

export const {
    sessionInitializing,
    sessionBootstrapFailed,
    sessionAuthenticated,
    sessionNeedsProfile,
    sessionCleared,
} = sessionSlice.actions
export const sessionReducer = sessionSlice.reducer
