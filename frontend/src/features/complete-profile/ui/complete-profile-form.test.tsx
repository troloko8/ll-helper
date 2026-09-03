import { Provider } from 'react-redux'
import { HttpResponse, http } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createApiTestStore, server } from '@/shared/lib/test'
import { CompleteProfileForm } from './complete-profile-form'

function renderCompleteProfileForm(onSuccess = vi.fn()) {
    const store = createApiTestStore()
    const view = render(
        <Provider store={store}>
            <CompleteProfileForm onSuccess={onSuccess} />
        </Provider>,
    )

    return { ...view, onSuccess }
}

async function fillValidProfile() {
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

describe('CompleteProfileForm', () => {
    it('shows backend-aligned client validation errors', async () => {
        const user = userEvent.setup()
        renderCompleteProfileForm()

        await user.click(
            screen.getByRole('button', { name: 'Initialize Profile' }),
        )

        expect(screen.getByText('Username is required')).toBeInTheDocument()
        expect(screen.getByText('First name is required')).toBeInTheDocument()
        expect(screen.getByText('Last name is required')).toBeInTheDocument()
        expect(
            screen.getByText('native language is required'),
        ).toBeInTheDocument()
        expect(
            screen.getByText('target language is required'),
        ).toBeInTheDocument()
    })

    it('submits the canonical profile fields and omits avatar input', async () => {
        const onSuccess = vi.fn()
        server.use(
            http.post('http://localhost/api/v1/users', async ({ request }) => {
                const profile = await request.json()
                expect(profile).toEqual({
                    username: 'jane_doe',
                    firstName: 'Jane',
                    lastName: 'Doe',
                    nativeLanguage: 'en',
                    targetLanguage: 'ja',
                    uiLanguage: 'en',
                    avatarUrl: null,
                })

                return HttpResponse.json({
                    id: 42,
                    username: 'jane_doe',
                    firstName: 'Jane',
                    lastName: 'Doe',
                    nativeLanguage: 'en',
                    targetLanguage: 'ja',
                    uiLanguage: 'en',
                    avatarUrl: null,
                    createdAt: '2026-09-03T00:00:00Z',
                    updatedAt: '2026-09-03T00:00:00Z',
                })
            }),
        )
        renderCompleteProfileForm(onSuccess)
        const user = await fillValidProfile()

        await user.click(
            screen.getByRole('button', { name: 'Initialize Profile' }),
        )

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledWith(
                expect.objectContaining({ id: 42, username: 'jane_doe' }),
            )
        })
    })

    it('maps a username conflict to the username field', async () => {
        server.use(
            http.post('http://localhost/api/v1/users', () =>
                HttpResponse.json(
                    { message: 'Username already taken: jane_doe' },
                    { status: 409 },
                ),
            ),
        )
        renderCompleteProfileForm()
        const user = await fillValidProfile()

        await user.click(
            screen.getByRole('button', { name: 'Initialize Profile' }),
        )

        expect(
            await screen.findByText('This username is already taken.'),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('textbox', { name: 'Username' }),
        ).toHaveAttribute('aria-invalid', 'true')
    })
})
