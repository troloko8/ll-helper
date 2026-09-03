import { Provider } from 'react-redux'
import { HttpResponse, http } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createApiTestStore, server } from '@/shared/lib/test'
import { RegisterForm } from './register-form'

function renderRegisterForm(onSuccess = vi.fn()) {
    const store = createApiTestStore()
    const view = render(
        <Provider store={store}>
            <RegisterForm onSuccess={onSuccess} />
        </Provider>,
    )

    return { ...view, onSuccess }
}

describe('RegisterForm', () => {
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

    it('submits valid credentials and returns the authentication response', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        server.use(
            http.post('http://localhost/api/v1/auth/register', () =>
                HttpResponse.json({ accessToken: 'register-token' }),
            ),
        )
        renderRegisterForm(onSuccess)

        await user.type(
            screen.getByRole('textbox', { name: 'Email' }),
            'new-user@example.com',
        )
        await user.type(screen.getByLabelText(/^Password/), 'password123')
        await user.click(screen.getByRole('button', { name: 'Create Account' }))

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledWith({
                accessToken: 'register-token',
            })
        })
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
