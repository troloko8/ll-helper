import { createSlice } from '@reduxjs/toolkit'

export type SessionStatus =
    | 'initializing'
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

export const { sessionAuthenticated, sessionNeedsProfile, sessionCleared } =
    sessionSlice.actions
export const sessionReducer = sessionSlice.reducer
