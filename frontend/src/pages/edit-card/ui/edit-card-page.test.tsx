import { Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/app/test'
import {
    useGetCardByIdQuery,
    type CardDetailsResponseDto,
} from '@/entities/card'
import { useGetDeckByIdQuery } from '@/entities/deck'
import {
    useGetLearningDeckQuery,
    useGetStudySessionQuery,
} from '@/entities/learning'
import type { UserResponseDto } from '@/entities/user'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { EditCardPage } from './edit-card-page'

const owner: UserResponseDto = {
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
    synonyms: ['buenas', 'saludos'],
    examples: ['Hola, Ana.'],
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
}
function CardCacheProbe() {
    useGetCardByIdQuery(7)
    return null
}

function CardDeletionCacheProbe() {
    useGetDeckByIdQuery(12)
    useGetLearningDeckQuery(12)
    useGetStudySessionQuery(12)
    return null
}

function renderPage(
    route = '/decks/12/cards/7/edit',
    options: {
        keepCardSubscribed?: boolean
        keepDeletionCachesSubscribed?: boolean
    } = {},
) {
    return renderWithProviders(
        <>
            {options.keepCardSubscribed && <CardCacheProbe />}
            {options.keepDeletionCachesSubscribed && <CardDeletionCacheProbe />}
            <Routes>
                <Route
                    path="/decks/:deckId/cards/:cardId/edit"
                    element={<EditCardPage />}
                />
                <Route
                    path="/decks/:deckId/cards/:cardId"
                    element={<h1>Card details destination</h1>}
                />
                <Route
                    path="/decks/:deckId/manage"
                    element={<h1>Manage deck destination</h1>}
                />
            </Routes>
        </>,
        { route },
    )
}

describe('EditCardPage', () => {
    beforeEach(() => {
        setToken('owner-token')
        server.use(
            http.get('http://localhost/api/v1/users/me', () =>
                HttpResponse.json(owner),
            ),
            http.get('http://localhost/api/v1/cards/7', () =>
                HttpResponse.json(card),
            ),
        )
    })

    it('prefills the shared form and omits the create-only AI action', async () => {
        let deckRequests = 0
        server.use(
            http.get('http://localhost/api/v1/decks/12', () => {
                deckRequests += 1
                return HttpResponse.json(
                    { message: 'Unexpected request' },
                    { status: 500 },
                )
            }),
        )
        renderPage()

        expect(
            await screen.findByRole('heading', { name: 'Edit Card' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('textbox', { name: 'Target word' }),
        ).toHaveValue('hola')
        expect(screen.getByRole('textbox', { name: 'Definition' })).toHaveValue(
            'A greeting',
        )
        expect(screen.getByRole('textbox', { name: 'Synonyms' })).toHaveValue(
            'buenas, saludos',
        )
        expect(
            screen.queryByRole('button', { name: /generate with ai/i }),
        ).not.toBeInTheDocument()
        expect(deckRequests).toBe(0)
    })

    it('updates the card and returns to Card Details', async () => {
        let requestBody: unknown
        server.use(
            http.put('http://localhost/api/v1/cards/7', async ({ request }) => {
                requestBody = await request.json()
                return HttpResponse.json({ ...card, title: 'hola!' })
            }),
        )
        const user = userEvent.setup()
        renderPage()

        const title = await screen.findByRole('textbox', {
            name: 'Target word',
        })
        await user.clear(title)
        await user.type(title, 'hola!')
        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        expect(
            await screen.findByRole('heading', {
                name: 'Card details destination',
            }),
        ).toBeInTheDocument()
        expect(requestBody).toMatchObject({
            title: 'hola!',
            synonyms: ['buenas', 'saludos'],
            examples: ['Hola, Ana.'],
        })
    })

    it('cancels deletion without a mutation, then deletes after confirmation', async () => {
        let deletes = 0
        server.use(
            http.delete('http://localhost/api/v1/cards/7', () => {
                deletes += 1
                return new HttpResponse(null, { status: 204 })
            }),
        )
        const user = userEvent.setup()
        renderPage()
        await screen.findByRole('heading', { name: 'Edit Card' })

        await user.click(screen.getByRole('button', { name: 'Delete card' }))
        let dialog = screen.getByRole('dialog', { name: 'Delete this card?' })
        expect(dialog).toHaveTextContent("every learner's progress")
        await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
        expect(deletes).toBe(0)

        await user.click(screen.getByRole('button', { name: 'Delete card' }))
        dialog = screen.getByRole('dialog', { name: 'Delete this card?' })
        await user.click(
            within(dialog).getByRole('button', { name: 'Delete card' }),
        )

        expect(
            await screen.findByRole('heading', {
                name: 'Manage deck destination',
            }),
        ).toBeInTheDocument()
        expect(deletes).toBe(1)
    })

    it('invalidates deck and learning caches after deletion', async () => {
        const requests = {
            deck: 0,
            learningDeck: 0,
            study: 0,
        }
        server.use(
            http.get('http://localhost/api/v1/decks/12', () => {
                requests.deck += 1
                return HttpResponse.json({
                    id: 12,
                    title: 'Spanish basics',
                    description: 'Useful words',
                    sourceLanguage: 'ES',
                    targetLanguage: 'EN',
                    createdAt: '2026-09-01T10:00:00Z',
                    updatedAt: '2026-09-01T10:00:00Z',
                    owner,
                    isPublic: false,
                    isEnrolled: true,
                    cards: [card],
                })
            }),
            http.get('http://localhost/api/v1/learning/decks/12', () => {
                requests.learningDeck += 1
                return HttpResponse.json({
                    deckId: 12,
                    title: 'Spanish basics',
                    sourceLanguage: 'ES',
                    targetLanguage: 'EN',
                    enrolledAt: '2026-09-01T10:00:00Z',
                    lastStudiedAt: null,
                    progress: { masteredCount: 0, totalCount: 1 },
                    cards: [],
                })
            }),
            http.get('http://localhost/api/v1/decks/12/study', () => {
                requests.study += 1
                return HttpResponse.json({
                    deckId: 12,
                    deckTitle: 'Spanish basics',
                    cards: [],
                })
            }),
            http.delete(
                'http://localhost/api/v1/cards/7',
                () => new HttpResponse(null, { status: 204 }),
            ),
        )
        const user = userEvent.setup()
        renderPage('/decks/12/cards/7/edit', {
            keepDeletionCachesSubscribed: true,
        })

        await screen.findByRole('heading', { name: 'Edit Card' })
        await waitFor(() => {
            expect(requests).toEqual({
                deck: 1,
                learningDeck: 1,
                study: 1,
            })
        })

        await user.click(screen.getByRole('button', { name: 'Delete card' }))
        await user.click(
            within(
                screen.getByRole('dialog', { name: 'Delete this card?' }),
            ).getByRole('button', { name: 'Delete card' }),
        )

        await screen.findByRole('heading', { name: 'Manage deck destination' })
        await waitFor(() => {
            expect(requests.deck).toBeGreaterThanOrEqual(2)
            expect(requests.learningDeck).toBeGreaterThanOrEqual(2)
            expect(requests.study).toBeGreaterThanOrEqual(2)
        })
    })

    it('keeps a delete failure inline and remains on the editor', async () => {
        server.use(
            http.delete('http://localhost/api/v1/cards/7', () =>
                HttpResponse.json(
                    { message: 'Card is locked' },
                    { status: 500 },
                ),
            ),
        )
        const user = userEvent.setup()
        renderPage()
        await screen.findByRole('heading', { name: 'Edit Card' })
        await user.click(screen.getByRole('button', { name: 'Delete card' }))
        const dialog = screen.getByRole('dialog', { name: 'Delete this card?' })
        await user.click(
            within(dialog).getByRole('button', { name: 'Delete card' }),
        )

        await waitFor(() => {
            expect(
                within(dialog).getByText('Unable to delete card'),
            ).toBeVisible()
        })
        expect(screen.getByRole('heading', { name: 'Edit Card' })).toBeVisible()
    })

    it('rejects invalid ids and a card from a different deck', async () => {
        const { unmount } = renderPage('/decks/0/cards/not-a-number/edit')
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
        expect(
            screen.queryByRole('button', { name: 'Save changes' }),
        ).not.toBeInTheDocument()
    })

    it("guards another user's card editor", async () => {
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
            screen.queryByRole('button', { name: 'Save changes' }),
        ).not.toBeInTheDocument()
    })

    it('retries a failed editor load', async () => {
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

        await screen.findByRole('heading', {
            name: 'Unable to prepare card editor',
        })
        await user.click(screen.getByRole('button', { name: 'Try again' }))

        expect(
            await screen.findByRole('heading', { name: 'Edit Card' }),
        ).toBeInTheDocument()
        expect(requests).toBe(2)
    })

    it('cancels editing without sending an update', async () => {
        let updates = 0
        server.use(
            http.put('http://localhost/api/v1/cards/7', () => {
                updates += 1
                return HttpResponse.json(card)
            }),
        )
        const user = userEvent.setup()
        renderPage()
        await screen.findByRole('heading', { name: 'Edit Card' })

        await user.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(
            screen.getByRole('heading', { name: 'Card details destination' }),
        ).toBeInTheDocument()
        expect(updates).toBe(0)
    })

    it('blocks invalid input before sending an update', async () => {
        let updates = 0
        server.use(
            http.put('http://localhost/api/v1/cards/7', () => {
                updates += 1
                return HttpResponse.json(card)
            }),
        )
        const user = userEvent.setup()
        renderPage()
        const title = await screen.findByRole('textbox', {
            name: 'Target word',
        })

        await user.clear(title)
        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        expect(
            await screen.findByText('Target word is required'),
        ).toBeInTheDocument()
        expect(updates).toBe(0)
    })

    it('shows server field validation without leaving the editor', async () => {
        server.use(
            http.put('http://localhost/api/v1/cards/7', () =>
                HttpResponse.json(
                    {
                        message: 'Validation failed',
                        errors: { title: 'This target word is already used' },
                    },
                    { status: 400 },
                ),
            ),
        )
        const user = userEvent.setup()
        renderPage()
        await screen.findByRole('heading', { name: 'Edit Card' })

        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        expect(
            await screen.findByText('This target word is already used'),
        ).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Edit Card' })).toBeVisible()
    })

    it('keeps a general update failure inline', async () => {
        server.use(
            http.put('http://localhost/api/v1/cards/7', () =>
                HttpResponse.json(
                    { message: 'Temporary failure' },
                    { status: 500 },
                ),
            ),
        )
        const user = userEvent.setup()
        renderPage()
        await screen.findByRole('heading', { name: 'Edit Card' })

        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        expect(
            await screen.findByText('Unable to update card'),
        ).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Edit Card' })).toBeVisible()
    })

    it('invalidates and refreshes an active card cache after saving', async () => {
        let cardRequests = 0
        server.use(
            http.get('http://localhost/api/v1/cards/7', () => {
                cardRequests += 1
                return HttpResponse.json(card)
            }),
            http.put('http://localhost/api/v1/cards/7', () =>
                HttpResponse.json({ ...card, title: 'updated' }),
            ),
        )
        const user = userEvent.setup()
        renderPage('/decks/12/cards/7/edit', { keepCardSubscribed: true })
        await screen.findByRole('heading', { name: 'Edit Card' })

        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        await screen.findByRole('heading', {
            name: 'Card details destination',
        })
        await waitFor(() => expect(cardRequests).toBeGreaterThanOrEqual(2))
    })
})
