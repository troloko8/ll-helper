import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { sessionAuthenticated } from '@/entities/session'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { appRoutes } from './router/router'
import { bootstrapSession } from './session-bootstrap'
import { createAppStore } from './store'

describe('Logout orchestration', () => {
    it('returns to login and keeps protected content hidden after Back and refresh', async () => {
        server.use(
            http.get('http://localhost/api/v1/learning/decks', () =>
                HttpResponse.json([]),
            ),
        )
        const store = createAppStore()
        setToken('current-user-token')
        store.dispatch(sessionAuthenticated())

        const router = createMemoryRouter(appRoutes, {
            initialEntries: ['/login', '/learning'],
            initialIndex: 1,
        })

        const view = render(
            <Provider store={store}>
                <RouterProvider router={router} />
            </Provider>,
        )
        const user = userEvent.setup()

        expect(
            await screen.findByRole('navigation', {
                name: 'Primary navigation',
            }),
        ).toBeInTheDocument()

        const logoutButtons = await screen.findAllByRole('button', {
            name: 'Log out',
        })
        await user.click(logoutButtons[0])

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/login')
        })
        expect(
            screen.getByRole('button', { name: 'Sign In' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('navigation', { name: 'Primary navigation' }),
        ).not.toBeInTheDocument()

        await router.navigate(-1)

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/login')
        })
        expect(
            screen.queryByRole('navigation', { name: 'Primary navigation' }),
        ).not.toBeInTheDocument()

        view.unmount()

        const refreshedStore = createAppStore()
        await bootstrapSession(refreshedStore.dispatch)
        const refreshedRouter = createMemoryRouter(appRoutes, {
            initialEntries: ['/learning'],
        })

        render(
            <Provider store={refreshedStore}>
                <RouterProvider router={refreshedRouter} />
            </Provider>,
        )

        await waitFor(() => {
            expect(refreshedRouter.state.location.pathname).toBe('/login')
        })
        expect(
            screen.getByRole('button', { name: 'Sign In' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('navigation', { name: 'Primary navigation' }),
        ).not.toBeInTheDocument()
    })
})
