import { Route, Routes } from 'react-router-dom'
import { HttpResponse, delay, http } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/app/test'
import type { CardDetailsResponseDto } from '@/entities/card'
import type { UserResponseDto } from '@/entities/user'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { CardDetailsPage } from './card-details-page'

const user: UserResponseDto = {
    id: 42,
    username: 'owner',
    firstName: 'Deck',
    lastName: 'Owner',
    nativeLanguage: 'EN',
    targetLanguage: 'ES',
    avatarUrl: null,
    uiLanguage: 'EN',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
}
const card: CardDetailsResponseDto = {
    id: 7,
    deckId: 12,
    deckOwnerId: 42,
    title: 'hola',
    definition: 'A greeting',
    translation: 'hello',
    synonyms: ['buenas'],
    examples: ['Hola, Ana.'],
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
}
function renderPage(route = '/decks/12/cards/7') {
    return renderWithProviders(
        <Routes>
            <Route
                path="/decks/:deckId/cards/:cardId"
                element={<CardDetailsPage />}
            />
        </Routes>,
        { route },
    )
}

describe('CardDetailsPage', () => {
    beforeEach(() => {
        setToken('owner-token')
        server.use(
            http.get('http://localhost/api/v1/users/me', () =>
                HttpResponse.json(user),
            ),
            http.get('http://localhost/api/v1/cards/7', () =>
                HttpResponse.json(card),
            ),
        )
    })

    it('shows honest loading and renders all available sections', async () => {
        let deckRequests = 0
        server.use(
            http.get('http://localhost/api/v1/decks/12', () => {
                deckRequests += 1
                return HttpResponse.json(
                    { message: 'Unexpected request' },
                    { status: 500 },
                )
            }),
            http.get('http://localhost/api/v1/cards/7', async () => {
                await delay(20)
                return HttpResponse.json(card)
            }),
        )
        renderPage()

        expect(
            screen.getByRole('status', { name: 'Loading card details' }),
        ).toHaveAttribute('aria-busy', 'true')
        expect(
            await screen.findByRole('heading', { name: 'hola' }),
        ).toBeInTheDocument()
        expect(screen.getByText('A greeting')).toBeInTheDocument()
        expect(screen.getByText('hello')).toBeInTheDocument()
        expect(screen.getByText('buenas')).toBeInTheDocument()
        expect(screen.getByText('Hola, Ana.')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Edit card' })).toHaveAttribute(
            'href',
            '/decks/12/cards/7/edit',
        )
        expect(
            screen.getByRole('link', { name: /Back to deck/ }),
        ).toHaveAttribute('href', '/decks/12/manage')
        expect(deckRequests).toBe(0)
    })

    it('omits absent optional sections', async () => {
        server.use(
            http.get('http://localhost/api/v1/cards/7', () =>
                HttpResponse.json({
                    ...card,
                    definition: null,
                    synonyms: null,
                    examples: [],
                }),
            ),
        )
        renderPage()

        await screen.findByRole('heading', { name: 'hola' })
        expect(screen.queryByText('Definition')).not.toBeInTheDocument()
        expect(screen.queryByText('Synonyms')).not.toBeInTheDocument()
        expect(screen.queryByText('Usage examples')).not.toBeInTheDocument()
    })

    it('rejects invalid and inconsistent route ids', async () => {
        const { unmount } = renderPage('/decks/0/cards/not-a-number')
        expect(
            screen.getByRole('heading', { name: 'Invalid card' }),
        ).toBeInTheDocument()
        unmount()

        server.use(
            http.get('http://localhost/api/v1/cards/7', () =>
                HttpResponse.json({ ...card, deckId: 99 }),
            ),
        )
        renderPage()
        expect(
            await screen.findByRole('heading', { name: 'Card not found' }),
        ).toBeInTheDocument()
    })

    it("does not expose owner actions for another user's deck", async () => {
        server.use(
            http.get('http://localhost/api/v1/cards/7', () =>
                HttpResponse.json({ ...card, deckOwnerId: 99 }),
            ),
        )
        renderPage()

        expect(
            await screen.findByRole('heading', { name: 'Owner access only' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('link', { name: 'Edit card' }),
        ).not.toBeInTheDocument()
    })

    it.each([
        [403, "You don't have permission to perform this action."],
        [404, 'The requested resource could not be found.'],
    ])('presents a safe %i loading error', async (status, message) => {
        server.use(
            http.get('http://localhost/api/v1/cards/7', () =>
                HttpResponse.json({ message: 'Backend details' }, { status }),
            ),
        )
        renderPage()

        expect(
            await screen.findByRole('heading', {
                name: 'Unable to load card',
            }),
        ).toBeInTheDocument()
        expect(screen.getByText(message)).toBeInTheDocument()
    })

    it('retries a failed load and renders the card', async () => {
        let requests = 0
        server.use(
            http.get('http://localhost/api/v1/cards/7', () => {
                requests += 1
                return requests === 1
                    ? HttpResponse.json(
                          { message: 'Temporary failure' },
                          { status: 500 },
                      )
                    : HttpResponse.json(card)
            }),
        )
        const user = userEvent.setup()
        renderPage()

        await screen.findByRole('heading', { name: 'Unable to load card' })
        await user.click(screen.getByRole('button', { name: 'Try again' }))

        expect(
            await screen.findByRole('heading', { name: 'hola' }),
        ).toBeInTheDocument()
        expect(requests).toBe(2)
    })
})
