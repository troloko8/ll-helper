import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/app/test'
import type { CardResponseDto } from '@/entities/card'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { AddCardForm } from './add-card-form'

const createdCard: CardResponseDto = {
    id: 91,
    deckId: 12,
    title: 'Ephemeral',
    definition: 'Lasting for a very short time.',
    translation: 'Мимолётный',
    synonyms: ['fleeting', 'transient'],
    examples: ['The moment was ephemeral.'],
    createdAt: '2026-09-09T10:00:00Z',
    updatedAt: '2026-09-09T10:00:00Z',
}

async function fillCardForm() {
    const user = userEvent.setup()

    await user.type(
        screen.getByRole('textbox', { name: 'Target word' }),
        '  Ephemeral  ',
    )
    await user.type(
        screen.getByRole('textbox', { name: 'Definition' }),
        'Lasting for a very short time.',
    )
    await user.type(
        screen.getByRole('textbox', { name: 'Translation' }),
        'Мимолётный',
    )
    await user.type(
        screen.getByRole('textbox', { name: 'Synonyms' }),
        ' fleeting, transient ',
    )
    await user.type(
        screen.getByRole('textbox', { name: 'Example 1' }),
        'The moment was ephemeral.',
    )

    return user
}

describe('AddCardForm', () => {
    beforeEach(() => {
        setToken('card-token')
    })

    it('shows client validation before submitting an empty target word', async () => {
        const user = userEvent.setup()
        renderWithProviders(<AddCardForm deckId={12} />)

        await user.click(screen.getByRole('button', { name: 'Save card' }))

        expect(
            await screen.findByText('Target word is required'),
        ).toBeInTheDocument()
    })

    it('creates a manual card with normalized list fields', async () => {
        const onSuccess = vi.fn()
        server.use(
            http.post('http://localhost/api/v1/cards', async ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer card-token',
                )
                expect(await request.json()).toEqual({
                    title: 'Ephemeral',
                    definition: 'Lasting for a very short time.',
                    translation: 'Мимолётный',
                    synonyms: ['fleeting', 'transient'],
                    examples: ['The moment was ephemeral.'],
                    deckId: 12,
                    autoGenerate: false,
                })
                return HttpResponse.json(createdCard, { status: 201 })
            }),
        )
        renderWithProviders(<AddCardForm deckId={12} onSuccess={onSuccess} />)
        const user = await fillCardForm()

        await user.click(screen.getByRole('button', { name: 'Save card' }))

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledWith(createdCard)
        })
    })

    it('creates and saves a card with AI from the target word only', async () => {
        const onSuccess = vi.fn()
        server.use(
            http.post('http://localhost/api/v1/cards', async ({ request }) => {
                expect(await request.json()).toEqual({
                    title: 'Ephemeral',
                    definition: null,
                    translation: null,
                    synonyms: null,
                    examples: null,
                    deckId: 12,
                    autoGenerate: true,
                })
                return HttpResponse.json(createdCard, { status: 201 })
            }),
        )
        renderWithProviders(<AddCardForm deckId={12} onSuccess={onSuccess} />)
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', { name: 'Target word' }),
            '  Ephemeral  ',
        )
        await user.click(
            screen.getByRole('button', { name: /Generate with AI/i }),
        )

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledWith(createdCard)
        })
    })

    it('requires a target word before starting AI generation', async () => {
        const user = userEvent.setup()
        renderWithProviders(<AddCardForm deckId={12} />)

        await user.click(
            screen.getByRole('button', { name: /Generate with AI/i }),
        )

        expect(
            await screen.findByText('Target word is required'),
        ).toBeInTheDocument()
    })

    it('shows the AI loading state and locks manual fields', async () => {
        server.use(
            http.post('http://localhost/api/v1/cards', async () => {
                await delay('infinite')
                return HttpResponse.json(createdCard, { status: 201 })
            }),
        )
        renderWithProviders(<AddCardForm deckId={12} />)
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', { name: 'Target word' }),
            'Ephemeral',
        )
        await user.click(
            screen.getByRole('button', { name: /Generate with AI/i }),
        )

        expect(
            await screen.findByRole('button', { name: 'Generating card' }),
        ).toBeDisabled()
        expect(
            screen.getByRole('textbox', { name: 'Definition' }),
        ).toBeDisabled()
    })

    it('shows AI-specific provider errors and allows retry', async () => {
        let requestCount = 0
        const onSuccess = vi.fn()
        server.use(
            http.post('http://localhost/api/v1/cards', () => {
                requestCount += 1
                return requestCount === 1
                    ? HttpResponse.json(
                          { message: 'AI provider is not available' },
                          { status: 503 },
                      )
                    : HttpResponse.json(createdCard, { status: 201 })
            }),
        )
        renderWithProviders(<AddCardForm deckId={12} onSuccess={onSuccess} />)
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', { name: 'Target word' }),
            'Ephemeral',
        )
        await user.click(
            screen.getByRole('button', { name: /Generate with AI/i }),
        )

        const errorTitle = await screen.findByText('AI generation failed')
        expect(errorTitle.closest('[role="alert"]')).toHaveTextContent(
            'Something went wrong on our side. Try again later.',
        )

        await user.click(
            screen.getByRole('button', { name: /Generate with AI/i }),
        )
        await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(createdCard))
    })

    it('adds and removes optional example fields', async () => {
        const user = userEvent.setup()
        renderWithProviders(<AddCardForm deckId={12} />)

        await user.click(screen.getByRole('button', { name: 'Add another' }))

        expect(
            screen.getByRole('textbox', { name: 'Example 2' }),
        ).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: 'Remove example 2' }),
        )

        expect(
            screen.queryByRole('textbox', { name: 'Example 2' }),
        ).not.toBeInTheDocument()
    })

    it('maps backend validation errors to the target word field', async () => {
        server.use(
            http.post('http://localhost/api/v1/cards', () =>
                HttpResponse.json(
                    {
                        errors: {
                            title: 'Title must be less than 100 characters',
                        },
                    },
                    { status: 400 },
                ),
            ),
        )
        renderWithProviders(<AddCardForm deckId={12} />)
        const user = await fillCardForm()

        await user.click(screen.getByRole('button', { name: 'Save card' }))

        expect(
            await screen.findByText('Title must be less than 100 characters'),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('textbox', { name: 'Target word' }),
        ).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows submitting and rate-limit states', async () => {
        server.use(
            http.post('http://localhost/api/v1/cards', async () => {
                await delay('infinite')
                return HttpResponse.json(createdCard, { status: 201 })
            }),
        )
        renderWithProviders(<AddCardForm deckId={12} />)
        const user = await fillCardForm()

        await user.click(screen.getByRole('button', { name: 'Save card' }))

        expect(
            await screen.findByRole('button', { name: 'Saving card' }),
        ).toBeDisabled()
        expect(
            screen.getByRole('textbox', { name: 'Target word' }),
        ).toBeDisabled()
    })

    it('shows the canonical inline submission error', async () => {
        server.use(
            http.post('http://localhost/api/v1/cards', () =>
                HttpResponse.json(
                    { message: 'Too many requests' },
                    { status: 429 },
                ),
            ),
        )
        renderWithProviders(<AddCardForm deckId={12} />)
        const user = await fillCardForm()

        await user.click(screen.getByRole('button', { name: 'Save card' }))

        const errorTitle = await screen.findByText('Unable to save card')
        expect(errorTitle.closest('[role="alert"]')).toHaveTextContent(
            'Wait a moment before trying again.',
        )
    })
})
