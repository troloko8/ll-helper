import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from '@/shared/api'

export function createApiTestStore() {
    return configureStore({
        reducer: {
            [baseApi.reducerPath]: baseApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(baseApi.middleware),
    })
}
