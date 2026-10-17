import { Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/app/test'
import type { DeckDetailsResponseDto } from '@/entities/deck'
import type { UserResponseDto } from '@/entities/user'
import { baseApi, setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { BulkGenerateCardsPage } from './bulk-generate-cards-page'

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

const deck: DeckDetailsResponseDto = {
    id: 12,
    title: 'Spanish Core 1000',
    description: 'Essential vocabulary.',
    sourceLanguage: 'ES',
    targetLanguage: 'EN',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    owner: currentUser,
    isPublic: false,
    isEnrolled: false,
    cards: [],
}

function renderPage() {
    return renderWithProviders(
        <Routes>
            <Route
                path="/decks/:deckId/cards/bulk"
                element={<BulkGenerateCardsPage />}
            />
        </Routes>,
        { route: '/decks/12/cards/bulk' },
    )
}

describe('BulkGenerateCardsPage', () => {
    beforeEach(() => {
        setToken('owner-token')
        server.use(
            http.get('http://localhost/api/v1/users/me', () =>
                HttpResponse.json(currentUser),
            ),
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(deck),
            ),
        )
    })

    it('renders the owner bulk flow with deck context and mode navigation', async () => {
        renderPage()

        expect(
            await screen.findByRole('heading', {
                name: 'Generate cards with AI',
            }),
        ).toBeInTheDocument()
        expect(screen.getByText('Spanish → English')).toBeInTheDocument()
        expect(
            screen.getByText(/Enter words or phrases in Spanish/),
        ).toHaveTextContent(
            'Enter words or phrases in Spanish. AI will generate English translations.',
        )
        expect(
            screen.getByRole('textbox', {
                name: 'Words or phrases in Spanish',
            }),
        ).toHaveAccessibleDescription(/AI will generate English translations/)
        expect(
            screen.getByRole('link', { name: 'Single card' }),
        ).toHaveAttribute('href', '/decks/12/cards/new')
    })

    it("does not expose bulk generation for another user's deck", async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({
                    ...deck,
                    owner: { ...currentUser, id: 99 },
                }),
            ),
        )

        renderPage()

        expect(
            await screen.findByRole('heading', { name: 'Owner access only' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('textbox', {
                name: 'Words or phrases in Spanish',
            }),
        ).not.toBeInTheDocument()
    })

    it('discards the deck workflow when the deck is no longer available', async () => {
        const user = userEvent.setup()
        const { store } = renderPage()
        const input = await screen.findByRole('textbox', {
            name: 'Words or phrases in Spanish',
        })

        await user.type(input, 'Ephemeral')
        expect(store.getState().bulkGeneration.byDeckId[12]?.draft).toBe(
            'Ephemeral',
        )

        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(
                    { message: 'Deck not found' },
                    { status: 404 },
                ),
            ),
        )
        store.dispatch(baseApi.util.resetApiState())

        expect(
            await screen.findByRole('heading', {
                name: 'Unable to prepare bulk generation',
            }),
        ).toBeInTheDocument()
        await waitFor(() => {
            expect(store.getState().bulkGeneration.byDeckId[12]).toBeUndefined()
        })
    })

    it('discards the deck workflow when the current user is not the owner', async () => {
        const user = userEvent.setup()
        const { store } = renderPage()
        const input = await screen.findByRole('textbox', {
            name: 'Words or phrases in Spanish',
        })

        await user.type(input, 'Ephemeral')
        expect(store.getState().bulkGeneration.byDeckId[12]?.draft).toBe(
            'Ephemeral',
        )

        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({
                    ...deck,
                    owner: { ...currentUser, id: 99 },
                }),
            ),
        )
        store.dispatch(baseApi.util.resetApiState())

        expect(
            await screen.findByRole('heading', { name: 'Owner access only' }),
        ).toBeInTheDocument()
        await waitFor(() => {
            expect(store.getState().bulkGeneration.byDeckId[12]).toBeUndefined()
        })
    })
})
