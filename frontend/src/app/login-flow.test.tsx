import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { sessionCleared } from '@/entities/session'
import type { UserResponseDto } from '@/entities/user'
import { clearToken, getToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { appRoutes } from './router/router'
import { createAppStore } from './store'

const currentUser: UserResponseDto = {
    id: 42,
    username: 'learner',
    firstName: 'Test',
    lastName: 'Learner',
    nativeLanguage: 'en',
    targetLanguage: 'ru',
    avatarUrl: null,
    uiLanguage: 'en',
    createdAt: '2026-09-03T00:00:00Z',
    updatedAt: '2026-09-03T00:00:00Z',
}

function renderLoginFlow() {
    const store = createAppStore()
    store.dispatch(sessionCleared())

    const router = createMemoryRouter(appRoutes, {
        initialEntries: ['/login'],
    })

    render(
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>,
    )

    return { router }
}

async function submitLogin() {
    const user = userEvent.setup()

    await user.type(
        screen.getByRole('textbox', { name: 'Email' }),
        'learner@example.com',
    )
    await user.type(screen.getByLabelText(/^Password/), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
}

describe('Login orchestration', () => {
    beforeEach(() => {
        clearToken()
        server.use(
            http.post('http://localhost/api/v1/auth/login', () =>
                HttpResponse.json({ accessToken: 'login-token' }),
            ),
            http.get('http://localhost/api/v1/learning/decks', () =>
                HttpResponse.json([]),
            ),
        )
    })

    it('stores the token and enters learning when the profile exists', async () => {
        server.use(
            http.get('http://localhost/api/v1/users/me', ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer login-token',
                )
                return HttpResponse.json(currentUser)
            }),
        )
        const { router } = renderLoginFlow()

        await submitLogin()

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/learning')
        })
        expect(getToken()).toBe('login-token')
    })

    it('keeps the token and opens profile onboarding when the profile is missing', async () => {
        server.use(
            http.get('http://localhost/api/v1/users/me', () =>
                HttpResponse.json(
                    { message: 'User profile not found' },
                    { status: 404 },
                ),
            ),
        )
        const { router } = renderLoginFlow()

        await submitLogin()

        expect(
            await screen.findByRole('heading', {
                name: 'Complete Your Profile',
            }),
        ).toBeInTheDocument()
        expect(router.state.location.pathname).toBe('/onboarding/profile')
        expect(getToken()).toBe('login-token')
    })

    it('clears the session and stays on login when the token is rejected', async () => {
        server.use(
            http.get('http://localhost/api/v1/users/me', () =>
                HttpResponse.json(
                    { message: 'Authentication required' },
                    { status: 401 },
                ),
            ),
        )
        const { router } = renderLoginFlow()

        await submitLogin()

        await waitFor(() => {
            expect(getToken()).toBeNull()
        })
        expect(router.state.location.pathname).toBe('/login')
        expect(
            screen.getByRole('button', { name: 'Sign In' }),
        ).toBeInTheDocument()
    })
})
