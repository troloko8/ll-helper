import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/app/test'
import type { PublicDeckListResponseDto } from '@/entities/deck'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { DiscoverPage } from './discover-page'

const owner = {
    id: 42,
    username: 'polyglot',
    firstName: 'Test',
    lastName: 'Creator',
    nativeLanguage: 'en',
    targetLanguage: 'es',
    avatarUrl: null,
    uiLanguage: 'en',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
}

const publicDecks: PublicDeckListResponseDto[] = [
    {
        id: 12,
        title: 'Spanish Core 1000',
        sourceLanguage: 'ES',
        targetLanguage: 'EN',
        owner,
        cardCount: 842,
        isEnrolled: true,
    },
    {
        id: 24,
        title: 'Japanese travel phrases',
        sourceLanguage: 'JA',
        targetLanguage: 'EN',
        owner: { ...owner, username: 'tokyo_vocab' },
        cardCount: 1,
        isEnrolled: false,
    },
]

describe('DiscoverPage', () => {
    beforeEach(() => {
        setToken('discover-token')
    })

    it('shows a loading state while public decks are requested', () => {
        server.use(
            http.get('http://localhost/api/v1/decks', async () => {
                await delay('infinite')
                return HttpResponse.json([])
            }),
        )

        renderWithProviders(<DiscoverPage />, { route: '/discover' })

        expect(
            screen.getByRole('status', { name: 'Loading public decks' }),
        ).toHaveAttribute('aria-busy', 'true')
    })

    it('renders the DECK-03 data and links each card to public details', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks', ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer discover-token',
                )
                return HttpResponse.json(publicDecks)
            }),
        )

        renderWithProviders(<DiscoverPage />, { route: '/discover' })

        expect(
            await screen.findByRole('heading', {
                name: 'Spanish Core 1000',
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Japanese travel phrases' }),
        ).toBeInTheDocument()
        expect(screen.getAllByText('Public')).toHaveLength(2)
        expect(screen.getByText('Enrolled')).toBeInTheDocument()
        expect(screen.getByText('842 cards')).toBeInTheDocument()
        expect(screen.getByText('1 card')).toBeInTheDocument()
        expect(screen.getByText('@polyglot')).toBeInTheDocument()
        expect(screen.getByText('@tokyo_vocab')).toBeInTheDocument()
        expect(screen.getByLabelText('Spanish to English')).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Open Spanish Core 1000' }),
        ).toHaveAttribute('href', '/decks/12')
    })

    it('shows an empty state when the backend returns no public decks', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks', () =>
                HttpResponse.json([]),
            ),
        )

        renderWithProviders(<DiscoverPage />, { route: '/discover' })

        expect(
            await screen.findByRole('heading', {
                name: 'No public decks yet',
            }),
        ).toBeInTheDocument()
    })

    it('shows a page error and retries the request', async () => {
        let requestCount = 0
        server.use(
            http.get('http://localhost/api/v1/decks', () => {
                requestCount += 1
                return requestCount === 1
                    ? HttpResponse.json(
                          { message: 'Public decks unavailable' },
                          { status: 500 },
                      )
                    : HttpResponse.json(publicDecks)
            }),
        )
        const user = userEvent.setup()

        renderWithProviders(<DiscoverPage />, { route: '/discover' })

        expect(
            await screen.findByRole('heading', {
                name: 'Could not load public decks',
            }),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Try again' }))

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Spanish Core 1000' }),
            ).toBeInTheDocument()
        })
    })
})
