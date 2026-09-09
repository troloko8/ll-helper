import { HttpResponse, http } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { DeckResponseDto } from '@/entities/deck'
import { renderWithProviders } from '@/app/test'
import { server } from '@/shared/lib/test'
import { CreateDeckPage } from './create-deck-page'

const createdDeck: DeckResponseDto = {
    id: 73,
    title: 'Travel Japanese',
    description: '',
    sourceLanguage: 'EN',
    targetLanguage: 'JA',
    createdAt: '2026-09-09T10:00:00Z',
    updatedAt: '2026-09-09T10:00:00Z',
    owner: {
        id: 42,
        username: 'learner',
        firstName: 'Test',
        lastName: 'Learner',
        nativeLanguage: 'en',
        targetLanguage: 'ja',
        avatarUrl: null,
        uiLanguage: 'en',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
    },
    isPublic: true,
    cards: [],
}

describe('CreateDeckPage', () => {
    it('shows backend-confirmed success and supports creating another deck', async () => {
        server.use(
            http.post('http://localhost/api/v1/decks', () =>
                HttpResponse.json(createdDeck, { status: 201 }),
            ),
        )
        const user = userEvent.setup()
        renderWithProviders(<CreateDeckPage />, { route: '/decks/new' })

        await user.type(
            screen.getByRole('textbox', { name: 'Deck title' }),
            'Travel Japanese',
        )
        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Target language' }),
            'JA',
        )
        await user.click(screen.getByRole('button', { name: 'Create Deck' }))

        expect(
            await screen.findByRole('heading', { name: 'Deck created' }),
        ).toBeInTheDocument()
        expect(screen.getByText('Travel Japanese')).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Manage deck' }),
        ).toHaveAttribute('href', '/decks/73/manage')

        await user.click(screen.getByRole('button', { name: 'Create another' }))

        expect(
            screen.getByRole('textbox', { name: 'Deck title' }),
        ).toBeInTheDocument()
    })
})
