import { createSlice } from '@reduxjs/toolkit'

export type SessionStatus = 'initializing' | 'authenticated' | 'anonymous'

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
        sessionCleared(state) {
            state.status = 'anonymous'
        },
    },
})

export const { sessionAuthenticated, sessionCleared } = sessionSlice.actions
export const sessionReducer = sessionSlice.reducer
