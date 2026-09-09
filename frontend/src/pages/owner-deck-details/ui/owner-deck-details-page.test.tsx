import { Route, Routes } from 'react-router-dom'
import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/app/test'
import type { DeckResponseDto } from '@/entities/deck'
import type { UserResponseDto } from '@/entities/user'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { OwnerDeckDetailsPage } from './owner-deck-details-page'

const currentUser: UserResponseDto = {
    id: 42,
    username: 'learner',
    firstName: 'Test',
    lastName: 'Learner',
    nativeLanguage: 'en',
    targetLanguage: 'es',
    avatarUrl: null,
    uiLanguage: 'en',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
}

const deck: DeckResponseDto = {
    id: 12,
    title: 'Spanish Core 1000',
    description: 'Essential vocabulary for daily conversation.',
    sourceLanguage: 'ES',
    targetLanguage: 'EN',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    owner: currentUser,
    isPublic: false,
    cards: [
        {
            id: 1,
            deckId: 12,
            title: 'Hola',
            definition: 'A common greeting',
            synonyms: null,
            examples: ['Hola, Ana.'],
            translation: 'Hello',
            createdAt: '2026-09-01T10:00:00Z',
            updatedAt: '2026-09-01T10:00:00Z',
        },
        {
            id: 2,
            deckId: 12,
            title: 'Gracias',
            definition: null,
            synonyms: [],
            examples: [],
            translation: 'Thank you',
            createdAt: '2026-09-01T10:00:00Z',
            updatedAt: '2026-09-01T10:00:00Z',
        },
    ],
}

function renderOwnerDeck(route = '/decks/12/manage') {
    return renderWithProviders(
        <Routes>
            <Route
                path="/decks/:deckId/manage"
                element={<OwnerDeckDetailsPage />}
            />
        </Routes>,
        { route },
    )
}

describe('OwnerDeckDetailsPage', () => {
    beforeEach(() => {
        setToken('owner-token')
        server.use(
            http.get('http://localhost/api/v1/users/me', () =>
                HttpResponse.json(currentUser),
            ),
        )
    })

    it('shows a loading state while the deck is requested', () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', async () => {
                await delay('infinite')
                return HttpResponse.json(deck)
            }),
        )

        renderOwnerDeck()

        expect(
            screen.getByRole('status', { name: 'Loading owner deck' }),
        ).toHaveAttribute('aria-busy', 'true')
    })

    it('renders owner deck content without learning progress', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer owner-token',
                )
                return HttpResponse.json(deck)
            }),
        )

        renderOwnerDeck()

        expect(
            await screen.findByRole('heading', {
                name: 'Spanish Core 1000',
            }),
        ).toBeInTheDocument()
        expect(screen.getByText('Spanish → English')).toBeInTheDocument()
        expect(screen.getByText('Hola')).toBeInTheDocument()
        expect(screen.getByText('Hello')).toBeInTheDocument()
        expect(screen.queryByText('Mastered')).not.toBeInTheDocument()
    })

    it('filters cards by source or target text', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(deck),
            ),
        )
        const user = userEvent.setup()
        renderOwnerDeck()

        await screen.findByText('Hola')
        await user.type(
            screen.getByRole('searchbox', { name: 'Search cards' }),
            'thank',
        )

        expect(screen.queryByText('Hola')).not.toBeInTheDocument()
        expect(screen.getByText('Gracias')).toBeInTheDocument()
    })

    it('shows the canonical empty inventory state', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({ ...deck, cards: [] }),
            ),
        )

        renderOwnerDeck()

        expect(
            await screen.findByRole('heading', { name: 'No cards yet' }),
        ).toBeInTheDocument()
    })

    it('shows a load error and retries the request', async () => {
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
        renderOwnerDeck()

        expect(
            await screen.findByRole('heading', {
                name: 'Unable to load deck',
            }),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Try again' }))

        await waitFor(() => {
            expect(screen.getByText('Hola')).toBeInTheDocument()
        })
    })

    it("does not expose owner controls for another user's public deck", async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({
                    ...deck,
                    owner: { ...currentUser, id: 99, username: 'someone-else' },
                    isPublic: true,
                }),
            ),
        )

        renderOwnerDeck()

        expect(
            await screen.findByRole('heading', { name: 'Owner access only' }),
        ).toBeInTheDocument()
        expect(screen.queryByText('Hola')).not.toBeInTheDocument()
    })
})
