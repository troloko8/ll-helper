import { Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/app/test'
import type { DeckResponseDto } from '@/entities/deck'
import type { UserResponseDto } from '@/entities/user'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { AddCardPage } from './add-card-page'

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
    description: 'Essential vocabulary.',
    sourceLanguage: 'ES',
    targetLanguage: 'EN',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    owner: currentUser,
    isPublic: false,
    cards: [],
}

function renderAddCard(route = '/decks/12/cards/new') {
    return renderWithProviders(
        <Routes>
            <Route path="/decks/:deckId/cards/new" element={<AddCardPage />} />
            <Route
                path="/decks/:deckId/manage"
                element={<h1>Manage deck destination</h1>}
            />
        </Routes>,
        { route },
    )
}

describe('AddCardPage', () => {
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

    it('loads the owner-only manual card form for the selected deck', async () => {
        renderAddCard()

        expect(
            await screen.findByRole('heading', { name: 'Add Card' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Back to Spanish Core 1000' }),
        ).toHaveAttribute('href', '/decks/12/manage')
        expect(
            screen.queryByRole('button', { name: /generate with ai/i }),
        ).not.toBeInTheDocument()
    })

    it("does not expose the form for another user's deck", async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({
                    ...deck,
                    owner: { ...currentUser, id: 99 },
                }),
            ),
        )

        renderAddCard()

        expect(
            await screen.findByRole('heading', { name: 'Owner access only' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('textbox', { name: 'Target word' }),
        ).not.toBeInTheDocument()
    })

    it('returns to deck management when the form is cancelled', async () => {
        const user = userEvent.setup()
        renderAddCard()

        await screen.findByRole('heading', { name: 'Add Card' })
        await user.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(
            screen.getByRole('heading', { name: 'Manage deck destination' }),
        ).toBeInTheDocument()
    })
})
