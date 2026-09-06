import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it } from 'vitest'
import {
    selectSessionStatus,
    sessionAuthenticated,
    sessionReducer,
} from '@/entities/session'
import { baseApi, getToken, setToken } from '@/shared/api'
import { logout } from './logout'

const logoutTestApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getLogoutTestValue: builder.query<{ value: string }, void>({
            query: () => '/__logout-test',
        }),
    }),
})

function createLogoutTestStore() {
    return configureStore({
        reducer: {
            session: sessionReducer,
            [baseApi.reducerPath]: baseApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(baseApi.middleware),
    })
}

describe('logout', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('clears the token, session, and cached API data', async () => {
        const store = createLogoutTestStore()
        setToken('current-user-token')
        store.dispatch(sessionAuthenticated())

        await store.dispatch(
            logoutTestApi.util.upsertQueryData(
                'getLogoutTestValue',
                undefined,
                { value: 'current user data' },
            ),
        )

        expect(
            logoutTestApi.endpoints.getLogoutTestValue.select()(
                store.getState(),
            ).data,
        ).toEqual({ value: 'current user data' })

        logout(store.dispatch)

        expect(getToken()).toBeNull()
        expect(selectSessionStatus(store.getState())).toBe('anonymous')
        expect(
            logoutTestApi.endpoints.getLogoutTestValue.select()(
                store.getState(),
            ).data,
        ).toBeUndefined()
    })
})
