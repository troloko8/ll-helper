import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/app/test'
import type {
    DeckCardResponseDto,
    LearningDeckResponseDto,
} from '@/entities/learning'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { LearningDeckDetailsPage } from './learning-deck-details-page'

const learningDeck: LearningDeckResponseDto = {
    deckId: 12,
    title: 'Spanish Core 1000',
    sourceLanguage: 'ES',
    targetLanguage: 'EN',
    enrolledAt: '2026-09-01T10:00:00Z',
    lastStudiedAt: '2026-09-08T18:30:00Z',
    progress: { masteredCount: 1, totalCount: 5 },
}

function card(
    id: number,
    title: string,
    translation: string,
    status: DeckCardResponseDto['progress']['status'],
): DeckCardResponseDto {
    return {
        id,
        title,
        definition: `${title} definition`,
        synonyms: [],
        examples: [],
        translation,
        progress: {
            status,
            timesSeen: 1,
            timesCorrect: 1,
            timesWrong: 0,
            correctStreak: 1,
        },
    }
}

const cards = [
    card(1, 'el tiempo', 'the time / weather', 'MASTERED'),
    card(2, 'desarrollar', 'to develop', 'REVIEWING'),
    card(3, 'la red', 'the network', 'LEARNING'),
    card(4, 'el teclado', 'the keyboard', 'LEARNING'),
    card(5, 'siempre', 'always', 'NEW'),
]

function renderDetailsPage() {
    return renderWithProviders(
        <Routes>
            <Route
                path="/learning/:deckId"
                element={<LearningDeckDetailsPage />}
            />
        </Routes>,
        { route: '/learning/12' },
    )
}

describe('LearningDeckDetailsPage', () => {
    beforeEach(() => {
        setToken('learning-token')
        server.use(
            http.get('http://localhost/api/v1/learning/decks', () =>
                HttpResponse.json([learningDeck]),
            ),
        )
    })

    it('shows a loading state while cards are requested', () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12/cards', async () => {
                await delay('infinite')
                return HttpResponse.json([])
            }),
        )

        renderDetailsPage()

        expect(
            screen.getByRole('status', { name: 'Loading learning deck' }),
        ).toHaveAttribute('aria-busy', 'true')
    })

    it('renders backend card statuses and derived per-deck counts', async () => {
        server.use(
            http.get(
                'http://localhost/api/v1/decks/12/cards',
                ({ request }) => {
                    expect(request.headers.get('Authorization')).toBe(
                        'Bearer learning-token',
                    )
                    return HttpResponse.json(cards)
                },
            ),
        )

        renderDetailsPage()

        expect(
            await screen.findByRole('heading', { name: 'Spanish Core 1000' }),
        ).toBeInTheDocument()
        expect(screen.getByText('Spanish → English')).toBeInTheDocument()
        expect(screen.getByText('20%')).toBeInTheDocument()
        expect(screen.getByText('el tiempo')).toBeInTheDocument()
        expect(screen.getByText('the time / weather')).toBeInTheDocument()

        const progress = screen.getByRole('region', { name: 'Deck progress' })
        expect(progress).toHaveTextContent('Mastered1')
        expect(progress).toHaveTextContent('Reviewing1')
        expect(progress).toHaveTextContent('Learning2')
        expect(progress).toHaveTextContent('New1')
        expect(screen.getByRole('link', { name: 'Study now' })).toHaveAttribute(
            'href',
            '/study/12',
        )
    })

    it('shows the empty inventory state for a deck without cards', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12/cards', () =>
                HttpResponse.json([]),
            ),
        )

        renderDetailsPage()

        expect(
            await screen.findByRole('heading', {
                name: 'No cards in this deck',
            }),
        ).toBeInTheDocument()
        expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('shows a backend error and retries the card request', async () => {
        let requestCount = 0
        server.use(
            http.get('http://localhost/api/v1/decks/12/cards', () => {
                requestCount += 1
                return requestCount === 1
                    ? HttpResponse.json(
                          { message: 'Enrollment required' },
                          { status: 409 },
                      )
                    : HttpResponse.json(cards)
            }),
        )
        const user = userEvent.setup()

        renderDetailsPage()

        expect(
            await screen.findByRole('heading', {
                name: 'Could not load this learning deck',
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByText(
                'This action conflicts with the current state. Refresh and try again.',
            ),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Try again' }))

        await waitFor(() => {
            expect(screen.getByText('el tiempo')).toBeInTheDocument()
        })
    })
})
