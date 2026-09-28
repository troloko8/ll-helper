import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { OwnedDeckListResponseDto } from '@/entities/deck'
import { renderWithProviders } from '@/app/test'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { CreatedPage } from './created-page'

const ownedDecks: OwnedDeckListResponseDto[] = [
    {
        id: 12,
        title: 'English essentials',
        sourceLanguage: 'EN',
        targetLanguage: 'RU',
        isPublic: true,
        cardCount: 20,
    },
    {
        id: 24,
        title: 'Private Japanese notes',
        sourceLanguage: 'EN',
        targetLanguage: 'JA',
        isPublic: false,
        cardCount: 1,
    },
]

describe('CreatedPage', () => {
    beforeEach(() => {
        setToken('created-token')
    })

    it('shows a loading state while owned decks are requested', () => {
        server.use(
            http.get('http://localhost/api/v1/decks/mine', async () => {
                await delay('infinite')
                return HttpResponse.json([])
            }),
        )

        renderWithProviders(<CreatedPage />, { route: '/created' })

        expect(
            screen.getByRole('status', { name: 'Loading created decks' }),
        ).toHaveAttribute('aria-busy', 'true')
    })

    it('renders owned deck data and the accepted navigation targets', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/mine', ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer created-token',
                )
                return HttpResponse.json(ownedDecks)
            }),
        )

        renderWithProviders(<CreatedPage />, { route: '/created' })

        expect(
            await screen.findByRole('heading', {
                name: 'English essentials',
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Private Japanese notes' }),
        ).toBeInTheDocument()
        expect(screen.getByText('Public')).toBeInTheDocument()
        expect(screen.getByText('Private')).toBeInTheDocument()
        expect(screen.getByText('20 cards')).toBeInTheDocument()
        expect(screen.getByText('1 card')).toBeInTheDocument()
        expect(screen.getByLabelText('English to Russian')).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Open English essentials' }),
        ).toHaveAttribute('href', '/decks/12/manage')
        expect(
            screen.getByRole('link', { name: 'Create New Deck' }),
        ).toHaveAttribute('href', '/decks/new')
    })

    it('keeps Create New Deck available in the empty state', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/mine', () =>
                HttpResponse.json([]),
            ),
        )

        renderWithProviders(<CreatedPage />, { route: '/created' })

        expect(
            await screen.findByRole('heading', {
                name: 'No created decks yet',
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Create New Deck' }),
        ).toHaveAttribute('href', '/decks/new')
    })

    it('shows a page error and retries the request', async () => {
        let requestCount = 0
        server.use(
            http.get('http://localhost/api/v1/decks/mine', () => {
                requestCount += 1
                return requestCount === 1
                    ? HttpResponse.json(
                          { message: 'Created decks unavailable' },
                          { status: 500 },
                      )
                    : HttpResponse.json(ownedDecks)
            }),
        )
        const user = userEvent.setup()

        renderWithProviders(<CreatedPage />, { route: '/created' })

        expect(
            await screen.findByRole('heading', {
                name: 'Could not load created decks',
            }),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Try again' }))

        await waitFor(() => {
            expect(
                screen.getByRole('heading', {
                    name: 'English essentials',
                }),
            ).toBeInTheDocument()
        })
    })
})
