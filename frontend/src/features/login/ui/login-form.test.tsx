import { Provider } from 'react-redux'
import { HttpResponse, http } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createApiTestStore, server } from '@/shared/lib/test'
import { LoginForm } from './login-form'

function renderLoginForm(onSuccess = vi.fn()) {
    const store = createApiTestStore()
    const view = render(
        <Provider store={store}>
            <LoginForm onSuccess={onSuccess} />
        </Provider>,
    )

    return { ...view, onSuccess }
}

describe('LoginForm', () => {
    it('shows client validation errors before submitting', async () => {
        const user = userEvent.setup()
        renderLoginForm()

        await user.click(screen.getByRole('button', { name: 'Sign In' }))

        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Password is required')).toBeInTheDocument()
    })

    it('submits valid credentials and returns the authentication response', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        server.use(
            http.post('http://localhost/api/v1/auth/login', () =>
                HttpResponse.json({ accessToken: 'login-token' }),
            ),
        )
        renderLoginForm(onSuccess)

        await user.type(
            screen.getByRole('textbox', { name: 'Email' }),
            'learner@example.com',
        )
        await user.type(screen.getByLabelText(/^Password/), 'password123')
        await user.click(screen.getByRole('button', { name: 'Sign In' }))

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledWith({
                accessToken: 'login-token',
            })
        })
    })

    it('maps backend field validation errors to their controls', async () => {
        const user = userEvent.setup()
        server.use(
            http.post('http://localhost/api/v1/auth/login', () =>
                HttpResponse.json(
                    { errors: { email: 'Email is not valid' } },
                    { status: 400 },
                ),
            ),
        )
        renderLoginForm()

        await user.type(
            screen.getByRole('textbox', { name: 'Email' }),
            'learner@example.com',
        )
        await user.type(screen.getByLabelText(/^Password/), 'password123')
        await user.click(screen.getByRole('button', { name: 'Sign In' }))

        expect(
            await screen.findByText('Email is not valid'),
        ).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
            'aria-invalid',
            'true',
        )
    })

    it.each([
        [401, 'Invalid email or password.'],
        [429, 'Wait a minute before trying again.'],
    ])('shows a form-level message for HTTP %s', async (status, message) => {
        const user = userEvent.setup()
        server.use(
            http.post('http://localhost/api/v1/auth/login', () =>
                HttpResponse.json({ message: 'Request rejected' }, { status }),
            ),
        )
        renderLoginForm()

        await user.type(
            screen.getByRole('textbox', { name: 'Email' }),
            'learner@example.com',
        )
        await user.type(screen.getByLabelText(/^Password/), 'password123')
        await user.click(screen.getByRole('button', { name: 'Sign In' }))

        expect(await screen.findByText(message)).toBeInTheDocument()
    })
})
