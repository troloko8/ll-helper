import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
    sessionAuthenticated,
    sessionCleared,
    sessionNeedsProfile,
} from '@/entities/session'
import { createAppStore } from '../store'
import { appRoutes } from './router'

type ResolvedSessionStatus = 'anonymous' | 'needsProfile' | 'authenticated'

const sessionActions = {
    anonymous: sessionCleared,
    needsProfile: sessionNeedsProfile,
    authenticated: sessionAuthenticated,
} as const

function renderRoute(path: string, status?: ResolvedSessionStatus) {
    const store = createAppStore()

    if (status) {
        store.dispatch(sessionActions[status]())
    }

    const router = createMemoryRouter(appRoutes, {
        initialEntries: [path],
    })

    render(
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>,
    )

    return { router, store }
}

describe('router session boundaries', () => {
    it.each([
        '/login',
        '/register',
        '/onboarding/profile',
        '/',
        '/missing-page',
    ])('blocks %s while the session is initializing', (path) => {
        renderRoute(path)

        expect(
            screen.getByRole('heading', {
                name: 'Preparing your workspace',
            }),
        ).toBeInTheDocument()
        expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    })

    it('allows an anonymous user to open login', async () => {
        renderRoute('/login', 'anonymous')

        expect(
            await screen.findByRole('heading', { name: 'LLHelper' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Sign In' }),
        ).toBeInTheDocument()
    })

    it('allows an anonymous user to open register', async () => {
        renderRoute('/register', 'anonymous')

        expect(
            await screen.findByRole('heading', { name: 'Create Account' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Create Account' }),
        ).toBeInTheDocument()
    })

    it.each(['/onboarding/profile', '/', '/missing-page'])(
        'redirects an anonymous user from %s to login',
        async (path) => {
            const { router } = renderRoute(path, 'anonymous')

            await waitFor(() => {
                expect(router.state.location.pathname).toBe('/login')
            })
        },
    )

    it('allows a user who needs a profile to open onboarding', async () => {
        renderRoute('/onboarding/profile', 'needsProfile')

        expect(
            await screen.findByRole('heading', {
                name: 'Complete Your Profile',
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Initialize Profile' }),
        ).toBeInTheDocument()
    })

    it.each(['/login', '/register', '/', '/missing-page'])(
        'redirects a user who needs a profile from %s to onboarding',
        async (path) => {
            const { router } = renderRoute(path, 'needsProfile')

            await waitFor(() => {
                expect(router.state.location.pathname).toBe(
                    '/onboarding/profile',
                )
            })
        },
    )

    it.each(['/login', '/register', '/onboarding/profile'])(
        'redirects an authenticated user from %s to learning',
        async (path) => {
            const { router } = renderRoute(path, 'authenticated')

            await waitFor(() => {
                expect(router.state.location.pathname).toBe('/learning')
            })
        },
    )

    it('redirects the authenticated root route to learning', async () => {
        const { router } = renderRoute('/', 'authenticated')

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/learning')
        })
    })

    it('allows an authenticated user to reach learning', () => {
        const { router } = renderRoute('/learning', 'authenticated')

        expect(router.state.location.pathname).toBe('/learning')
        expect(
            screen.queryByRole('heading', { name: 'Preparing your workspace' }),
        ).not.toBeInTheDocument()
    })

    it('shows not found to an authenticated user at an unknown URL', async () => {
        renderRoute('/missing-page', 'authenticated')

        expect(
            await screen.findByRole('heading', { name: 'Page not found' }),
        ).toBeInTheDocument()
    })
})
