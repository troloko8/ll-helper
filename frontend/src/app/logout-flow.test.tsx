import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { sessionAuthenticated } from '@/entities/session'
import { logout } from '@/features/logout'
import { baseApi, getToken, setToken } from '@/shared/api'
import { appRoutes } from './router/router'
import { createAppStore } from './store'

const logoutFlowApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getLogoutFlowValue: builder.query<{ value: string }, void>({
            query: () => '/__logout-flow',
        }),
    }),
})

describe('Logout orchestration', () => {
    it('clears the local session and returns to login', async () => {
        const store = createAppStore()
        setToken('current-user-token')
        store.dispatch(sessionAuthenticated())
        await store.dispatch(
            logoutFlowApi.util.upsertQueryData(
                'getLogoutFlowValue',
                undefined,
                { value: 'current user data' },
            ),
        )

        const router = createMemoryRouter(appRoutes, {
            initialEntries: ['/learning'],
        })

        render(
            <Provider store={store}>
                <RouterProvider router={router} />
            </Provider>,
        )

        act(() => {
            logout(store.dispatch)
        })

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/login')
        })
        expect(getToken()).toBeNull()
        expect(store.getState()[baseApi.reducerPath].queries).toEqual({})
        expect(
            screen.getByRole('button', { name: 'Sign In' }),
        ).toBeInTheDocument()
    })
})
