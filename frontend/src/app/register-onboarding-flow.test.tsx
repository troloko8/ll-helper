import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { sessionCleared } from '@/entities/session'
import { clearToken, getToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { appRoutes } from './router/router'
import { createAppStore } from './store'

function renderRegistrationFlow() {
    const store = createAppStore()
    store.dispatch(sessionCleared())

    const router = createMemoryRouter(appRoutes, {
        initialEntries: ['/register'],
    })

    render(
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>,
    )

    return { router }
}

async function fillProfile() {
    const user = userEvent.setup()

    await user.type(
        screen.getByRole('textbox', { name: 'Username' }),
        'jane_doe',
    )
    await user.type(screen.getByRole('textbox', { name: 'First name' }), 'Jane')
    await user.type(screen.getByRole('textbox', { name: 'Last name' }), 'Doe')
    await user.selectOptions(
        screen.getByRole('combobox', { name: 'Native language' }),
        'en',
    )
    await user.selectOptions(
        screen.getByRole('combobox', { name: 'Target language' }),
        'ja',
    )

    return user
}

async function registerNewUser() {
    const user = userEvent.setup()

    await user.type(
        screen.getByRole('textbox', { name: 'Email' }),
        'new-user@example.com',
    )
    await user.type(screen.getByLabelText(/^Password/), 'password123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await screen.findByRole('heading', {
        name: 'Complete Your Profile',
    })
}

describe('Register to Complete Profile orchestration', () => {
    beforeEach(() => {
        clearToken()
    })

    it('stores the token, completes the profile, and enters learning', async () => {
        server.use(
            http.post('http://localhost/api/v1/auth/register', () =>
                HttpResponse.json({ accessToken: 'register-token' }),
            ),
            http.post('http://localhost/api/v1/users', ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer register-token',
                )

                return HttpResponse.json({
                    id: 42,
                    username: 'jane_doe',
                    firstName: 'Jane',
                    lastName: 'Doe',
                    nativeLanguage: 'en',
                    targetLanguage: 'ja',
                    uiLanguage: 'en',
                    avatarUrl: null,
                    createdAt: '2026-09-06T00:00:00Z',
                    updatedAt: '2026-09-06T00:00:00Z',
                })
            }),
        )
        const { router } = renderRegistrationFlow()
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', { name: 'Email' }),
            'new-user@example.com',
        )
        await user.type(screen.getByLabelText(/^Password/), 'password123')
        await user.click(screen.getByRole('button', { name: 'Create Account' }))

        expect(
            await screen.findByRole('heading', {
                name: 'Complete Your Profile',
            }),
        ).toBeInTheDocument()
        expect(getToken()).toBe('register-token')
        expect(router.state.location.pathname).toBe('/onboarding/profile')

        const profileUser = await fillProfile()
        await profileUser.click(
            screen.getByRole('button', { name: 'Initialize Profile' }),
        )

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/learning')
        })
    })

    it.each([
        {
            status: 400,
            errorBody: {
                errors: { username: 'Username contains invalid characters' },
            },
            errorMessage: 'Username contains invalid characters',
        },
        {
            status: 409,
            errorBody: { message: 'Username already taken: jane_doe' },
            errorMessage: 'This username is already taken.',
        },
    ])(
        'keeps the session after HTTP $status and allows profile submission to be retried',
        async ({ status, errorBody, errorMessage }) => {
            let profileRequestCount = 0
            server.use(
                http.post('http://localhost/api/v1/auth/register', () =>
                    HttpResponse.json({ accessToken: 'register-token' }),
                ),
                http.post('http://localhost/api/v1/users', ({ request }) => {
                    expect(request.headers.get('Authorization')).toBe(
                        'Bearer register-token',
                    )
                    profileRequestCount += 1

                    if (profileRequestCount === 1) {
                        return HttpResponse.json(errorBody, { status })
                    }

                    return HttpResponse.json({
                        id: 42,
                        username: 'jane_doe_2',
                        firstName: 'Jane',
                        lastName: 'Doe',
                        nativeLanguage: 'en',
                        targetLanguage: 'ja',
                        uiLanguage: 'en',
                        avatarUrl: null,
                        createdAt: '2026-09-06T00:00:00Z',
                        updatedAt: '2026-09-06T00:00:00Z',
                    })
                }),
            )
            const { router } = renderRegistrationFlow()

            await registerNewUser()
            const profileUser = await fillProfile()
            await profileUser.click(
                screen.getByRole('button', { name: 'Initialize Profile' }),
            )

            expect(await screen.findByText(errorMessage)).toBeInTheDocument()
            expect(router.state.location.pathname).toBe('/onboarding/profile')
            expect(getToken()).toBe('register-token')

            const username = screen.getByRole('textbox', {
                name: 'Username',
            })
            await profileUser.clear(username)
            await profileUser.type(username, 'jane_doe_2')
            await profileUser.click(
                screen.getByRole('button', { name: 'Initialize Profile' }),
            )

            await waitFor(() => {
                expect(router.state.location.pathname).toBe('/learning')
            })
            expect(profileRequestCount).toBe(2)
            expect(getToken()).toBe('register-token')
        },
    )
})
