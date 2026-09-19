import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { sessionReducer, selectSessionStatus } from '@/entities/session'
import { useSelector } from 'react-redux'
import { baseApi, clearToken, getToken } from '@/shared/api'
import { Provider } from 'react-redux'
import { HttpResponse, http } from 'msw'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { server } from '@/shared/lib/test'
import { RegisterForm } from './register-form'

function OnboardingDestination() {
    const status = useSelector(selectSessionStatus)
    return status === 'needsProfile' ? <h1>Complete your profile</h1> : null
}

function renderRegisterForm() {
    const store = configureStore({
        reducer: {
            session: sessionReducer,
            [baseApi.reducerPath]: baseApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(baseApi.middleware),
    })
    return render(
        <Provider store={store}>
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<RegisterForm />} />
                    <Route
                        path="/onboarding/profile"
                        element={<OnboardingDestination />}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>,
    )
}

describe('RegisterForm', () => {
    afterEach(() => clearToken())
    it('shows backend-aligned client validation errors', async () => {
        const user = userEvent.setup()
        renderRegisterForm()

        await user.type(
            screen.getByRole('textbox', { name: 'Email' }),
            'not-an-email',
        )
        await user.type(screen.getByLabelText(/^Password/), '12345')
        await user.click(screen.getByRole('button', { name: 'Create Account' }))

        expect(
            screen.getByText('Enter a valid email address'),
        ).toBeInTheDocument()
        expect(
            screen.getByText('Password must be at least 6 characters'),
        ).toBeInTheDocument()
    })

    it('stores the token and opens onboarding after successful registration', async () => {
        const user = userEvent.setup()
        server.use(
            http.post('http://localhost/api/v1/auth/register', () =>
                HttpResponse.json({ accessToken: 'register-token' }),
            ),
        )
        renderRegisterForm()

        await user.type(
            screen.getByRole('textbox', { name: 'Email' }),
            'new-user@example.com',
        )
        await user.type(screen.getByLabelText(/^Password/), 'password123')
        await user.click(screen.getByRole('button', { name: 'Create Account' }))

        expect(
            await screen.findByRole('heading', {
                name: 'Complete your profile',
            }),
        ).toBeInTheDocument()
        expect(getToken()).toBe('register-token')
    })

    it('maps backend field validation errors to their controls', async () => {
        server.use(
            http.post('http://localhost/api/v1/auth/register', () =>
                HttpResponse.json(
                    { errors: { email: 'Email is not valid' } },
                    { status: 400 },
                ),
            ),
        )
        renderRegisterForm()
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', { name: 'Email' }),
            'new-user@example.com',
        )
        await user.type(screen.getByLabelText(/^Password/), 'password123')
        await user.click(screen.getByRole('button', { name: 'Create Account' }))

        expect(
            await screen.findByText('Email is not valid'),
        ).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
            'aria-invalid',
            'true',
        )
    })

    it('shows an email conflict returned by the backend', async () => {
        const user = userEvent.setup()
        server.use(
            http.post('http://localhost/api/v1/auth/register', () =>
                HttpResponse.json(
                    { message: 'Email already exists' },
                    { status: 409 },
                ),
            ),
        )
        renderRegisterForm()

        await user.type(
            screen.getByRole('textbox', { name: 'Email' }),
            'existing@example.com',
        )
        await user.type(screen.getByLabelText(/^Password/), 'password123')
        await user.click(screen.getByRole('button', { name: 'Create Account' }))

        expect(
            await screen.findByText(
                'An account with this email already exists.',
            ),
        ).toBeInTheDocument()
    })

    it('shows a rate-limit message returned by the backend', async () => {
        const user = userEvent.setup()
        server.use(
            http.post('http://localhost/api/v1/auth/register', () =>
                HttpResponse.json(
                    { message: 'Rate limit exceeded' },
                    { status: 429 },
                ),
            ),
        )
        renderRegisterForm()

        await user.type(
            screen.getByRole('textbox', { name: 'Email' }),
            'new-user@example.com',
        )
        await user.type(screen.getByLabelText(/^Password/), 'password123')
        await user.click(screen.getByRole('button', { name: 'Create Account' }))

        expect(
            await screen.findByText('Wait a minute before trying again.'),
        ).toBeInTheDocument()
    })
})
