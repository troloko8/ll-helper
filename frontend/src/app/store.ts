import { configureStore } from '@reduxjs/toolkit'
import { sessionReducer } from '@/entities/session'
import { baseApi } from '@/shared/api'
import { apiErrorListenerMiddleware } from './api-error-listener'
import { bootstrapSession } from './session-bootstrap'

export function createAppStore() {
    return configureStore({
        reducer: {
            session: sessionReducer,
            [baseApi.reducerPath]: baseApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(
                baseApi.middleware,
                apiErrorListenerMiddleware.middleware,
            ),
    })
}

export const store = createAppStore()

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

void bootstrapSession(store.dispatch)
