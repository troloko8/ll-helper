import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { LearningDeckResponseDto } from '@/entities/learning'
import { renderWithProviders } from '@/app/test'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { LearningPage } from './learning-page'

const learningDecks: LearningDeckResponseDto[] = [
    {
        deckId: 12,
        title: 'English essentials',
        sourceLanguage: 'EN',
        targetLanguage: 'RU',
        enrolledAt: '2026-09-01T10:00:00Z',
        lastStudiedAt: '2026-09-08T18:30:00Z',
        progress: { masteredCount: 8, totalCount: 20 },
    },
    {
        deckId: 24,
        title: 'Travel Japanese',
        sourceLanguage: 'EN',
        targetLanguage: 'JA',
        enrolledAt: '2026-09-07T08:00:00Z',
        lastStudiedAt: null,
        progress: { masteredCount: 0, totalCount: 15 },
    },
]

describe('LearningPage', () => {
    beforeEach(() => {
        setToken('learning-token')
    })

    it('shows the canonical loading state while decks are requested', async () => {
        server.use(
            http.get('http://localhost/api/v1/learning/decks', async () => {
                await delay('infinite')
                return HttpResponse.json([])
            }),
        )

        renderWithProviders(<LearningPage />, { route: '/learning' })

        expect(
            screen.getByRole('status', { name: 'Loading learning decks' }),
        ).toHaveAttribute('aria-busy', 'true')
    })

    it('renders backend-ordered decks and highlights the first studied deck', async () => {
        server.use(
            http.get(
                'http://localhost/api/v1/learning/decks',
                ({ request }) => {
                    expect(request.headers.get('Authorization')).toBe(
                        'Bearer learning-token',
                    )
                    return HttpResponse.json(learningDecks)
                },
            ),
        )

        renderWithProviders(<LearningPage />, { route: '/learning' })

        expect(
            await screen.findByRole('heading', {
                name: 'English essentials',
            }),
        ).toBeInTheDocument()
        expect(screen.getByText('Continue learning')).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Travel Japanese' }),
        ).toBeInTheDocument()
        expect(screen.getByText('8 / 20 mastered')).toBeInTheDocument()
        expect(screen.getByLabelText('English to Russian')).toBeInTheDocument()
    })

    it('labels an unstudied first deck as ready to start', async () => {
        server.use(
            http.get('http://localhost/api/v1/learning/decks', () =>
                HttpResponse.json([learningDecks[1]]),
            ),
        )

        renderWithProviders(<LearningPage />, { route: '/learning' })

        expect(await screen.findByText('Start learning')).toBeInTheDocument()
    })

    it('shows an empty state without a dead create-deck link', async () => {
        server.use(
            http.get('http://localhost/api/v1/learning/decks', () =>
                HttpResponse.json([]),
            ),
        )

        renderWithProviders(<LearningPage />, { route: '/learning' })

        expect(
            await screen.findByRole('heading', {
                name: 'No learning decks yet',
            }),
        ).toBeInTheDocument()
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('shows a page error and retries the request', async () => {
        let requestCount = 0
        server.use(
            http.get('http://localhost/api/v1/learning/decks', () => {
                requestCount += 1
                return requestCount === 1
                    ? HttpResponse.json(
                          { message: 'Learning unavailable' },
                          { status: 500 },
                      )
                    : HttpResponse.json(learningDecks)
            }),
        )
        const user = userEvent.setup()

        renderWithProviders(<LearningPage />, { route: '/learning' })

        expect(
            await screen.findByRole('heading', {
                name: 'Could not load learning decks',
            }),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Try again' }))

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'English essentials' }),
            ).toBeInTheDocument()
        })
    })
})
