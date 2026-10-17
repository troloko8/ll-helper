import { HttpResponse, delay, http } from 'msw'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '@/app/store'
import type { CardResponseDto } from '@/entities/card'
import { sessionCleared } from '@/entities/session'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { BulkGenerateCardsPanel } from './bulk-generate-cards-panel'

const createdCard: CardResponseDto = {
    id: 91,
    deckId: 12,
    title: 'Ephemeral',
    definition: 'Lasting for a very short time.',
    translation: 'Мимолётный',
    synonyms: ['fleeting'],
    examples: ['The moment was ephemeral.'],
    createdAt: '2026-09-09T10:00:00Z',
    updatedAt: '2026-09-09T10:00:00Z',
}

const secondCreatedCard: CardResponseDto = {
    ...createdCard,
    id: 92,
    title: 'Luminous',
    definition: 'Giving off light.',
    translation: 'Светящийся',
    synonyms: ['radiant'],
    examples: ['The dial was luminous in the dark.'],
}

const failedLuminous = {
    inputIndex: 1,
    title: 'Luminous',
    code: 'INVALID_AI_TRANSLATION' as const,
    message: 'AI could not generate a valid translation.',
    retryable: true,
}

function renderPanel() {
    const callbacks = {
        onViewCard: vi.fn(),
        onEditCard: vi.fn(),
        onBackToDeck: vi.fn(),
    }
    const router = createMemoryRouter([
        {
            path: '/',
            element: (
                <>
                    <Link to="/elsewhere">Leave test page</Link>
                    <BulkGenerateCardsPanel
                        deckId={12}
                        sourceLanguageLabel="English"
                        targetLanguageLabel="Russian"
                        {...callbacks}
                    />
                </>
            ),
        },
        {
            path: '/elsewhere',
            element: <h1>Other page</h1>,
        },
    ])
    const store = createAppStore()
    const view = render(
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>,
    )
    return { callbacks, router, store, ...view }
}

describe('BulkGenerateCardsPanel', () => {
    beforeEach(() => setToken('card-token'))

    it('shows parsed unique entries and submits only those titles', async () => {
        server.use(
            http.post(
                'http://localhost/api/v1/card-generations/bulk',
                async ({ request }) => {
                    expect(await request.json()).toEqual({
                        titles: ['Ephemeral', 'Luminous'],
                        deckId: 12,
                    })
                    return HttpResponse.json(
                        {
                            created: [createdCard],
                            failed: [failedLuminous],
                        },
                        { status: 201 },
                    )
                },
            ),
        )
        const { callbacks } = renderPanel()
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', {
                name: 'Words or phrases in English',
            }),
            '  Ephemeral  {enter}{enter}Luminous{enter}ephemeral',
        )

        expect(screen.getByText('2 entries')).toBeInTheDocument()
        expect(screen.getByText('1 duplicate removed')).toBeInTheDocument()
        await user.click(
            screen.getByRole('button', { name: 'Generate 2 cards' }),
        )

        expect(
            await screen.findByRole('heading', {
                name: '1 card created, 1 couldn’t be created',
            }),
        ).toHaveFocus()
        expect(screen.getByText('Мимолётный')).toBeInTheDocument()
        expect(
            screen.getByText('AI could not generate a valid translation.'),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'View' }))
        expect(callbacks.onViewCard).toHaveBeenCalledWith(createdCard)
        await user.click(screen.getByRole('button', { name: 'Back to deck' }))
        expect(callbacks.onBackToDeck).toHaveBeenCalledOnce()
    })

    it('collapses long previews and does not report zero duplicates', async () => {
        renderPanel()
        const user = userEvent.setup()
        const textbox = screen.getByRole('textbox', {
            name: 'Words or phrases in English',
        })

        fireEvent.change(textbox, {
            target: {
                value: Array.from(
                    { length: 12 },
                    (_, index) => `Entry ${index + 1}`,
                ).join('\n'),
            },
        })

        expect(
            screen.getByRole('heading', { name: 'Cards to generate (12)' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByText(/duplicates? removed/),
        ).not.toBeInTheDocument()
        expect(screen.getByText('Entry 10')).toBeInTheDocument()
        expect(screen.queryByText('Entry 11')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Show all 12' }))
        expect(screen.getByText('Entry 12')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Show less' }))
        expect(screen.queryByText('Entry 12')).not.toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Remove Entry 1' }),
        ).toBeInTheDocument()
    })

    it('shows an over-limit count and disables generation', () => {
        renderPanel()
        const textbox = screen.getByRole('textbox', {
            name: 'Words or phrases in English',
        })

        fireEvent.change(textbox, {
            target: {
                value: Array.from(
                    { length: 101 },
                    (_, index) => `Entry ${index + 1}`,
                ).join('\n'),
            },
        })

        expect(screen.getByText('101 / 100 entries')).toBeInTheDocument()
        expect(
            screen.getByText('Add at most 100 words or phrases'),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Generate 101 cards' }),
        ).toBeDisabled()
    })

    it('shows every submitted card in an all-created result', async () => {
        server.use(
            http.post('http://localhost/api/v1/card-generations/bulk', () =>
                HttpResponse.json(
                    {
                        created: [createdCard, secondCreatedCard],
                        failed: [],
                    },
                    { status: 201 },
                ),
            ),
        )
        renderPanel()
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', {
                name: 'Words or phrases in English',
            }),
            'Ephemeral{enter}Luminous',
        )
        await user.click(
            screen.getByRole('button', { name: 'Generate 2 cards' }),
        )

        expect(
            await screen.findByRole('heading', { name: '2 cards created' }),
        ).toHaveFocus()
        expect(
            screen.getByRole('heading', { name: 'Created (2)' }),
        ).toBeInTheDocument()
        expect(screen.getByText('Мимолётный')).toBeInTheDocument()
        expect(screen.getByText('Светящийся')).toBeInTheDocument()
        expect(
            screen.queryByRole('heading', { name: 'Failed (0)' }),
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'All (2)' }),
        ).not.toBeInTheDocument()
        expect(
            screen.getByText(/Created cards are already saved to the deck\./),
        ).toBeInTheDocument()
        expect(screen.queryByText('Saved')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Generate more' }))
        expect(
            screen.getByRole('textbox', {
                name: 'Words or phrases in English',
            }),
        ).toHaveValue('')
        expect(
            screen.queryByRole('heading', { name: '2 cards created' }),
        ).not.toBeInTheDocument()
    })

    it('shows every submitted entry in an all-failed result', async () => {
        server.use(
            http.post('http://localhost/api/v1/card-generations/bulk', () =>
                HttpResponse.json(
                    {
                        created: [],
                        failed: [
                            {
                                ...failedLuminous,
                                inputIndex: 0,
                                title: 'Ephemeral',
                            },
                            failedLuminous,
                        ],
                    },
                    { status: 201 },
                ),
            ),
        )
        renderPanel()
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', {
                name: 'Words or phrases in English',
            }),
            'Ephemeral{enter}Luminous',
        )
        await user.click(
            screen.getByRole('button', { name: 'Generate 2 cards' }),
        )

        expect(
            await screen.findByRole('heading', {
                name: 'No cards were created',
            }),
        ).toHaveFocus()
        expect(
            screen.getByRole('heading', { name: 'Failed (2)' }),
        ).toBeInTheDocument()
        expect(screen.getByText('Ephemeral')).toBeInTheDocument()
        expect(screen.getByText('Luminous')).toBeInTheDocument()
        expect(screen.getByText('Not created')).toBeInTheDocument()
        expect(screen.queryByText('Not saved')).not.toBeInTheDocument()
        expect(
            screen.queryByRole('heading', { name: 'Created (0)' }),
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'All (2)' }),
        ).not.toBeInTheDocument()
    })

    it('filters a mixed result by created and failed entries', async () => {
        server.use(
            http.post('http://localhost/api/v1/card-generations/bulk', () =>
                HttpResponse.json(
                    {
                        created: [createdCard],
                        failed: [failedLuminous],
                    },
                    { status: 201 },
                ),
            ),
        )
        renderPanel()
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', {
                name: 'Words or phrases in English',
            }),
            'Ephemeral{enter}Luminous',
        )
        await user.click(
            screen.getByRole('button', { name: 'Generate 2 cards' }),
        )

        expect(
            await screen.findByRole('heading', {
                name: '1 card created, 1 couldn’t be created',
            }),
        ).toHaveFocus()
        const createdFilter = screen.getByRole('button', {
            name: 'Created (1)',
        })
        const failedFilter = screen.getByRole('button', {
            name: 'Failed (1)',
        })
        const allFilter = screen.getByRole('button', { name: 'All (2)' })

        await user.click(createdFilter)
        expect(createdFilter).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByText('Мимолётный')).toBeInTheDocument()
        expect(
            screen.queryByText(failedLuminous.message),
        ).not.toBeInTheDocument()

        await user.click(failedFilter)
        expect(failedFilter).toHaveAttribute('aria-pressed', 'true')
        expect(screen.queryByText('Мимолётный')).not.toBeInTheDocument()
        expect(screen.getByText(failedLuminous.message)).toBeInTheDocument()

        await user.click(allFilter)
        expect(allFilter).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByText('Мимолётный')).toBeInTheDocument()
        expect(screen.getByText(failedLuminous.message)).toBeInTheDocument()
    })

    it('shows an indeterminate batch state without per-card progress', async () => {
        server.use(
            http.post(
                'http://localhost/api/v1/card-generations/bulk',
                async () => {
                    await delay('infinite')
                    return HttpResponse.json({ created: [], failed: [] })
                },
            ),
        )
        renderPanel()
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', {
                name: 'Words or phrases in English',
            }),
            'Ephemeral{enter}Luminous',
        )
        await user.click(
            screen.getByRole('button', { name: 'Generate 2 cards' }),
        )

        expect(
            await screen.findByRole('heading', {
                name: 'Generating 2 cards…',
            }),
        ).toBeInTheDocument()
        expect(screen.getByText('2 cards submitted')).toBeInTheDocument()
        expect(
            screen.getByText(
                'Results will appear when the whole batch is ready. You can visit other pages and return here to see the result.',
            ),
        ).toBeInTheDocument()
        expect(
            screen.queryByText('Processing in batch'),
        ).not.toBeInTheDocument()
        expect(
            screen.queryByText('No per-card streaming'),
        ).not.toBeInTheDocument()

        const submittedEntries = screen
            .getByText('View submitted entries')
            .closest('details')
        expect(submittedEntries).not.toHaveAttribute('open')
        await user.click(screen.getByText('View submitted entries'))
        expect(submittedEntries).toHaveAttribute('open')
        expect(screen.getByText('Ephemeral')).toBeInTheDocument()
        expect(screen.getByText('Luminous')).toBeInTheDocument()

        expect(
            screen.queryByRole('button', { name: /cancel/i }),
        ).not.toBeInTheDocument()
    })

    it('finishes generation after route navigation and restores the result on return', async () => {
        let finishRequest: (() => void) | undefined
        const responseGate = new Promise<void>((resolve) => {
            finishRequest = resolve
        })
        server.use(
            http.post(
                'http://localhost/api/v1/card-generations/bulk',
                async () => {
                    await responseGate
                    return HttpResponse.json(
                        { created: [createdCard], failed: [] },
                        { status: 201 },
                    )
                },
            ),
        )
        const { router } = renderPanel()
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', {
                name: 'Words or phrases in English',
            }),
            'Ephemeral',
        )
        await user.click(
            screen.getByRole('button', { name: 'Generate 1 card' }),
        )
        await screen.findByRole('heading', { name: 'Generating 1 card…' })

        await user.click(screen.getByRole('link', { name: 'Leave test page' }))

        expect(
            await screen.findByRole('heading', { name: 'Other page' }),
        ).toBeInTheDocument()

        finishRequest?.()
        await router.navigate('/')

        expect(
            await screen.findByRole('heading', { name: '1 card created' }),
        ).toHaveFocus()
        expect(screen.getByText('Мимолётный')).toBeInTheDocument()
    })

    it('clears the saved batch when the session is cleared', async () => {
        server.use(
            http.post('http://localhost/api/v1/card-generations/bulk', () =>
                HttpResponse.json(
                    { created: [createdCard], failed: [] },
                    { status: 201 },
                ),
            ),
        )
        const { store } = renderPanel()
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', {
                name: 'Words or phrases in English',
            }),
            'Ephemeral',
        )
        await user.click(
            screen.getByRole('button', { name: 'Generate 1 card' }),
        )
        await screen.findByRole('heading', { name: '1 card created' })

        act(() => {
            store.dispatch(sessionCleared())
        })

        expect(
            screen.getByRole('textbox', {
                name: 'Words or phrases in English',
            }),
        ).toHaveValue('')
    })

    it('returns to input with a request-level error and keeps the draft', async () => {
        server.use(
            http.post('http://localhost/api/v1/card-generations/bulk', () =>
                HttpResponse.json(
                    { message: 'Too many requests' },
                    { status: 429 },
                ),
            ),
        )
        renderPanel()
        const user = userEvent.setup()

        await user.type(
            screen.getByRole('textbox', {
                name: 'Words or phrases in English',
            }),
            'Ephemeral',
        )
        await user.click(
            screen.getByRole('button', { name: 'Generate 1 card' }),
        )

        const requestError = await screen.findByText('Bulk generation failed')
        const textbox = screen.getByRole('textbox', {
            name: 'Words or phrases in English',
        })
        expect(textbox).toHaveValue('Ephemeral')
        expect(
            requestError.compareDocumentPosition(textbox) &
                Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Generate 1 card' }),
            ).toBeEnabled()
        })
    })
})
