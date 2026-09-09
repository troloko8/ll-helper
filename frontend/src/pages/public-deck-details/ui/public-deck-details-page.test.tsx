import { Route, Routes } from 'react-router-dom'
import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/app/test'
import type { DeckResponseDto } from '@/entities/deck'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { PublicDeckDetailsPage } from './public-deck-details-page'

const deck: DeckResponseDto = {
    id: 12,
    title: 'Medical Spanish Terminology',
    description: 'Specialized vocabulary for healthcare professionals.',
    sourceLanguage: 'ES',
    targetLanguage: 'EN',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    owner: {
        id: 77,
        username: 'dr_ramirez',
        firstName: 'Elena',
        lastName: 'Ramirez',
        nativeLanguage: 'es',
        targetLanguage: 'en',
        avatarUrl: null,
        uiLanguage: 'en',
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
    },
    isPublic: true,
    cards: [
        {
            id: 1,
            deckId: 12,
            title: 'Presión arterial',
            definition: 'La fuerza de la sangre contra las arterias.',
            synonyms: null,
            examples: [],
            translation: 'Blood pressure',
            createdAt: '2026-09-01T10:00:00Z',
            updatedAt: '2026-09-01T10:00:00Z',
        },
        {
            id: 2,
            deckId: 12,
            title: 'Frecuencia cardíaca',
            definition: null,
            synonyms: null,
            examples: null,
            translation: 'Heart rate',
            createdAt: '2026-09-01T10:00:00Z',
            updatedAt: '2026-09-01T10:00:00Z',
        },
    ],
}

function renderPublicDeck(route = '/decks/12') {
    return renderWithProviders(
        <Routes>
            <Route path="/decks/:deckId" element={<PublicDeckDetailsPage />} />
            <Route
                path="/learning/:deckId"
                element={<h1>Learning deck destination</h1>}
            />
        </Routes>,
        { route },
    )
}

describe('PublicDeckDetailsPage', () => {
    beforeEach(() => {
        setToken('learner-token')
    })

    it('shows a loading state while the deck is requested', () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', async () => {
                await delay('infinite')
                return HttpResponse.json(deck)
            }),
        )

        renderPublicDeck()

        expect(
            screen.getByRole('status', { name: 'Loading public deck' }),
        ).toHaveAttribute('aria-busy', 'true')
    })

    it('renders public content without learning progress or social controls', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer learner-token',
                )
                return HttpResponse.json(deck)
            }),
        )

        renderPublicDeck()

        expect(
            await screen.findByRole('heading', {
                name: 'Medical Spanish Terminology',
            }),
        ).toBeInTheDocument()
        expect(screen.getByText('Spanish → English')).toBeInTheDocument()
        expect(screen.getByText('@dr_ramirez')).toBeInTheDocument()
        expect(screen.getByText('Presión arterial')).toBeInTheDocument()
        expect(screen.getByText('Blood pressure')).toBeInTheDocument()
        expect(screen.queryByText(/mastered/i)).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: /like/i }),
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: /follow/i }),
        ).not.toBeInTheDocument()
    })

    it('enrolls without a request body and opens learning deck details', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(deck),
            ),
            http.post(
                'http://localhost/api/v1/decks/12/enroll',
                async ({ request }) => {
                    expect(request.headers.get('Authorization')).toBe(
                        'Bearer learner-token',
                    )
                    expect(await request.text()).toBe('')
                    return HttpResponse.json(
                        { userDeckId: 501 },
                        { status: 201 },
                    )
                },
            ),
        )
        const user = userEvent.setup()
        renderPublicDeck()

        await user.click(
            await screen.findByRole('button', { name: 'Start learning' }),
        )

        expect(
            await screen.findByRole('heading', {
                name: 'Learning deck destination',
            }),
        ).toBeInTheDocument()
    })

    it('shows the enrolling state and disables the action', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(deck),
            ),
            http.post('http://localhost/api/v1/decks/12/enroll', async () => {
                await delay('infinite')
                return HttpResponse.json({ userDeckId: 501 }, { status: 201 })
            }),
        )
        const user = userEvent.setup()
        renderPublicDeck()

        await user.click(
            await screen.findByRole('button', { name: 'Start learning' }),
        )

        expect(
            await screen.findByRole('button', { name: 'Starting learning' }),
        ).toBeDisabled()
    })

    it('explains a duplicate enrollment without navigating', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(deck),
            ),
            http.post('http://localhost/api/v1/decks/12/enroll', () =>
                HttpResponse.json(
                    { message: 'Already enrolled' },
                    { status: 409 },
                ),
            ),
        )
        const user = userEvent.setup()
        renderPublicDeck()

        await user.click(
            await screen.findByRole('button', { name: 'Start learning' }),
        )

        const errorTitle = await screen.findByText('Already enrolled')
        expect(errorTitle.closest('[role="alert"]')).toHaveTextContent(
            'This deck is already in your Learning list.',
        )
        expect(
            screen.queryByRole('heading', {
                name: 'Learning deck destination',
            }),
        ).not.toBeInTheDocument()
    })

    it('shows the empty inventory state', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({ ...deck, cards: [] }),
            ),
        )

        renderPublicDeck()

        expect(
            await screen.findByRole('heading', { name: 'No cards yet' }),
        ).toBeInTheDocument()
    })

    it('does not offer enrollment for a private deck returned to its owner', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({ ...deck, isPublic: false }),
            ),
        )

        renderPublicDeck()

        expect(
            await screen.findByRole('heading', { name: 'Private deck' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Start learning' }),
        ).not.toBeInTheDocument()
    })

    it('shows a load error and retries the deck request', async () => {
        let requestCount = 0
        server.use(
            http.get('http://localhost/api/v1/decks/12', () => {
                requestCount += 1
                return requestCount === 1
                    ? HttpResponse.json(
                          { message: 'Deck unavailable' },
                          { status: 500 },
                      )
                    : HttpResponse.json(deck)
            }),
        )
        const user = userEvent.setup()
        renderPublicDeck()

        expect(
            await screen.findByRole('heading', { name: 'Unable to load deck' }),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Try again' }))

        await waitFor(() => {
            expect(screen.getByText('Presión arterial')).toBeInTheDocument()
        })
    })
})
