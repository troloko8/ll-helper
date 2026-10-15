import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/app/test'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { ProgressPage } from './progress-page'

const progress = [
    {
        deckId: 12,
        title: 'English essentials',
        sourceLanguage: 'EN',
        targetLanguage: 'RU',
        cardsByStatus: {
            newCount: 3,
            learningCount: 2,
            reviewingCount: 1,
            masteredCount: 4,
        },
        totalCards: 10,
    },
]

describe('ProgressPage', () => {
    beforeEach(() => setToken('progress-token'))

    it('renders the canonical aggregate metrics and a linked deck row', async () => {
        server.use(
            http.get(
                'http://localhost/api/v1/learning/progress',
                ({ request }) => {
                    expect(request.headers.get('Authorization')).toBe(
                        'Bearer progress-token',
                    )
                    return HttpResponse.json(progress)
                },
            ),
        )
        renderWithProviders(<ProgressPage />, { route: '/progress' })

        expect(
            await screen.findByRole('heading', { name: 'Learning Progress' }),
        ).toBeInTheDocument()
        expect(await screen.findAllByText('40.0%')).not.toHaveLength(0)

        const metrics = screen.getByRole('list', {
            name: 'Overall card distribution',
        })
        expect(within(metrics).getByText('Total cards')).toBeInTheDocument()
        expect(within(metrics).getByText('New')).toBeInTheDocument()
        expect(within(metrics).getByText('Learning')).toBeInTheDocument()
        expect(within(metrics).getByText('Review')).toBeInTheDocument()
        expect(within(metrics).getByText('Mastered')).toBeInTheDocument()
        expect(
            within(metrics).getByRole('progressbar', { name: 'New cards' }),
        ).toHaveAttribute('aria-valuenow', '30')
        expect(
            within(metrics).getByRole('progressbar', {
                name: 'Learning cards',
            }),
        ).toHaveAttribute('aria-valuenow', '20')
        expect(
            within(metrics).getByRole('progressbar', { name: 'Review cards' }),
        ).toHaveAttribute('aria-valuenow', '10')
        expect(
            within(metrics).getByRole('progressbar', {
                name: 'Mastered cards',
            }),
        ).toHaveAttribute('aria-valuenow', '40')

        const deckLink = screen.getByRole('link', {
            name: /English essentials/,
        })
        expect(deckLink).toHaveAttribute('href', '/learning/12')
        expect(within(deckLink).getByText('English essentials')).toBeInTheDocument()
        expect(within(deckLink).getByText('3')).toBeInTheDocument()
        expect(within(deckLink).getByText('2')).toBeInTheDocument()
        expect(within(deckLink).getByText('1')).toBeInTheDocument()
        expect(within(deckLink).getByText('4')).toBeInTheDocument()
        expect(
            screen.queryByRole('link', { name: /View deck/i }),
        ).not.toBeInTheDocument()
    })

    it('shows the loading state', () => {
        server.use(
            http.get('http://localhost/api/v1/learning/progress', async () => {
                await delay('infinite')
                return HttpResponse.json([])
            }),
        )
        renderWithProviders(<ProgressPage />, { route: '/progress' })
        expect(
            screen.getByRole('status', { name: 'Loading progress' }),
        ).toHaveAttribute('aria-busy', 'true')
    })

    it('shows an empty state', async () => {
        server.use(
            http.get('http://localhost/api/v1/learning/progress', () =>
                HttpResponse.json([]),
            ),
        )
        renderWithProviders(<ProgressPage />, { route: '/progress' })
        expect(
            await screen.findByRole('heading', {
                name: 'No learning progress yet',
            }),
        ).toBeInTheDocument()
    })

    it('retries a failed request', async () => {
        let attempts = 0
        server.use(
            http.get('http://localhost/api/v1/learning/progress', () => {
                attempts += 1
                return attempts === 1
                    ? HttpResponse.json(
                          { message: 'Unavailable' },
                          { status: 500 },
                      )
                    : HttpResponse.json(progress)
            }),
        )
        const user = userEvent.setup()
        renderWithProviders(<ProgressPage />, { route: '/progress' })
        await user.click(
            await screen.findByRole('button', { name: 'Try again' }),
        )
        await waitFor(() =>
            expect(screen.getAllByText('40.0%')).not.toHaveLength(0),
        )
    })
})
