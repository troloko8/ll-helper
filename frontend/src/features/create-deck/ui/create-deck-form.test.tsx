import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DeckResponseDto } from '@/entities/deck'
import { renderWithProviders } from '@/app/test'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { CreateDeckForm } from './create-deck-form'

const createdDeck: DeckResponseDto = {
    id: 73,
    title: 'Japanese Core 2000',
    description: 'Essential vocabulary for JLPT N3.',
    sourceLanguage: 'EN',
    targetLanguage: 'JA',
    createdAt: '2026-09-09T10:00:00Z',
    updatedAt: '2026-09-09T10:00:00Z',
    owner: {
        id: 42,
        username: 'learner',
        firstName: 'Test',
        lastName: 'Learner',
        nativeLanguage: 'en',
        targetLanguage: 'ja',
        avatarUrl: null,
        uiLanguage: 'en',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
    },
    isPublic: false,
    cards: [],
}

async function fillDeckForm() {
    const user = userEvent.setup()

    await user.type(
        screen.getByRole('textbox', { name: 'Deck title' }),
        'Japanese Core 2000',
    )
    await user.type(
        screen.getByRole('textbox', { name: 'Description' }),
        'Essential vocabulary for JLPT N3.',
    )
    await user.selectOptions(
        screen.getByRole('combobox', { name: 'Source language' }),
        'EN',
    )
    await user.selectOptions(
        screen.getByRole('combobox', { name: 'Target language' }),
        'JA',
    )

    return user
}

describe('CreateDeckForm', () => {
    beforeEach(() => {
        setToken('deck-token')
    })

    it('shows client validation before submitting an empty title', async () => {
        const user = userEvent.setup()
        renderWithProviders(<CreateDeckForm />)

        await user.click(screen.getByRole('button', { name: 'Create Deck' }))

        expect(
            await screen.findByText('Deck title is required'),
        ).toBeInTheDocument()
    })

    it('creates a deck and inverts Private Deck to isPublic', async () => {
        const onSuccess = vi.fn()
        server.use(
            http.post('http://localhost/api/v1/decks', async ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer deck-token',
                )
                expect(await request.json()).toEqual({
                    title: 'Japanese Core 2000',
                    description: 'Essential vocabulary for JLPT N3.',
                    sourceLanguage: 'EN',
                    targetLanguage: 'JA',
                    isPublic: false,
                })
                return HttpResponse.json(createdDeck, { status: 201 })
            }),
        )
        renderWithProviders(<CreateDeckForm onSuccess={onSuccess} />)
        const user = await fillDeckForm()

        await user.click(screen.getByRole('checkbox', { name: /Private Deck/ }))
        await user.click(screen.getByRole('button', { name: 'Create Deck' }))

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledWith(createdDeck)
        })
    })

    it('maps backend validation errors to their fields', async () => {
        server.use(
            http.post('http://localhost/api/v1/decks', () =>
                HttpResponse.json(
                    {
                        errors: {
                            title: 'title must be between 1 and 100 characters',
                        },
                    },
                    { status: 400 },
                ),
            ),
        )
        renderWithProviders(<CreateDeckForm />)
        const user = await fillDeckForm()

        await user.click(screen.getByRole('button', { name: 'Create Deck' }))

        expect(
            await screen.findByText(
                'title must be between 1 and 100 characters',
            ),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('textbox', { name: 'Deck title' }),
        ).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows the submitting state while the deck is being created', async () => {
        server.use(
            http.post('http://localhost/api/v1/decks', async () => {
                await delay('infinite')
                return HttpResponse.json(createdDeck, { status: 201 })
            }),
        )
        renderWithProviders(<CreateDeckForm />)
        const user = await fillDeckForm()

        await user.click(screen.getByRole('button', { name: 'Create Deck' }))

        expect(
            await screen.findByRole('button', { name: 'Creating deck' }),
        ).toBeDisabled()
        expect(
            screen.getByRole('textbox', { name: 'Deck title' }),
        ).toBeDisabled()
    })

    it('shows the canonical inline submission error', async () => {
        server.use(
            http.post('http://localhost/api/v1/decks', () =>
                HttpResponse.json(
                    { message: 'Too many requests' },
                    { status: 429 },
                ),
            ),
        )
        renderWithProviders(<CreateDeckForm />)
        const user = await fillDeckForm()

        await user.click(screen.getByRole('button', { name: 'Create Deck' }))

        const errorTitle = await screen.findByText('Unable to create deck')
        expect(errorTitle.closest('[role="alert"]')).toHaveTextContent(
            'Wait a moment before trying again.',
        )
    })

    it('allows the user to cancel without submitting', async () => {
        const onCancel = vi.fn()
        const user = userEvent.setup()
        renderWithProviders(<CreateDeckForm onCancel={onCancel} />)

        await user.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(onCancel).toHaveBeenCalledOnce()
    })
})
