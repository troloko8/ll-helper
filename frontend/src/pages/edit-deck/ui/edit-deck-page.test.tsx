import { Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/app/test'
import {
    useGetDeckByIdQuery,
    useGetOwnedDecksQuery,
    useGetPublicDecksInfiniteQuery,
    type DeckDetailsResponseDto,
} from '@/entities/deck'
import {
    useGetLearningDeckQuery,
    useGetLearningDecksQuery,
    useGetStudySessionQuery,
} from '@/entities/learning'
import type { UserResponseDto } from '@/entities/user'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { EditDeckPage } from './edit-deck-page'

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
const deck: DeckDetailsResponseDto = {
    id: 12,
    title: 'Spanish basics',
    description: 'Useful words',
    sourceLanguage: 'ES',
    targetLanguage: 'EN',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    owner,
    isPublic: false,
    isEnrolled: false,
    cards: [],
}

function DeckCacheProbe() {
    useGetDeckByIdQuery(12)
    return null
}

function DeckDeletionCacheProbe() {
    useGetDeckByIdQuery(12)
    useGetOwnedDecksQuery()
    useGetPublicDecksInfiniteQuery({ sort: 'NEWEST' })
    useGetLearningDecksQuery()
    useGetLearningDeckQuery(12)
    useGetStudySessionQuery(12)
    return null
}

function renderPage(
    route = '/decks/12/edit',
    options: {
        keepDeckSubscribed?: boolean
        keepDeletionCachesSubscribed?: boolean
    } = {},
) {
    return renderWithProviders(
        <>
            {options.keepDeckSubscribed && <DeckCacheProbe />}
            {options.keepDeletionCachesSubscribed && <DeckDeletionCacheProbe />}
            <Routes>
                <Route path="/decks/:deckId/edit" element={<EditDeckPage />} />
                <Route
                    path="/decks/:deckId/manage"
                    element={<h1>Manage deck destination</h1>}
                />
                <Route path="/created" element={<h1>Created destination</h1>} />
            </Routes>
        </>,
        { route },
    )
}

describe('EditDeckPage', () => {
    beforeEach(() => {
        setToken('owner-token')
        server.use(
            http.get('http://localhost/api/v1/users/me', () =>
                HttpResponse.json(owner),
            ),
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(deck),
            ),
        )
    })

    it('prefills owner data and maps private visibility', async () => {
        renderPage()

        expect(
            await screen.findByRole('heading', { name: 'Edit Deck' }),
        ).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'Deck title' })).toHaveValue(
            'Spanish basics',
        )
        expect(
            screen.getByRole('checkbox', { name: /Private Deck/ }),
        ).toBeChecked()
    })

    it('saves the inverse isPublic mapping and returns to management', async () => {
        let requestBody: unknown
        server.use(
            http.put(
                'http://localhost/api/v1/decks/12',
                async ({ request }) => {
                    requestBody = await request.json()
                    return HttpResponse.json({ ...deck, isPublic: true })
                },
            ),
        )
        const user = userEvent.setup()
        renderPage()

        const privacy = await screen.findByRole('checkbox', {
            name: /Private Deck/,
        })
        await user.click(privacy)
        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        expect(
            await screen.findByRole('heading', {
                name: 'Manage deck destination',
            }),
        ).toBeInTheDocument()
        expect(requestBody).toMatchObject({ isPublic: true })
    })

    it('deletes only after the destructive confirmation', async () => {
        let deletes = 0
        server.use(
            http.delete('http://localhost/api/v1/decks/12', () => {
                deletes += 1
                return new HttpResponse(null, { status: 204 })
            }),
        )
        const user = userEvent.setup()
        renderPage()
        await screen.findByRole('heading', { name: 'Edit Deck' })
        await user.click(screen.getByRole('button', { name: 'Delete deck' }))

        const dialog = screen.getByRole('dialog', { name: 'Delete this deck?' })
        expect(dialog).toHaveTextContent('every enrollment')
        expect(dialog).toHaveTextContent('all learner progress')
        await user.click(
            within(dialog).getByRole('button', { name: 'Delete deck' }),
        )

        expect(
            await screen.findByRole('heading', {
                name: 'Created destination',
            }),
        ).toBeInTheDocument()
        expect(deletes).toBe(1)
    })

    it('invalidates created, discover, deck, and learning caches after deletion', async () => {
        const requests = {
            deck: 0,
            created: 0,
            discover: 0,
            learningList: 0,
            learningDeck: 0,
            study: 0,
        }
        server.use(
            http.get('http://localhost/api/v1/decks/12', () => {
                requests.deck += 1
                return HttpResponse.json(deck)
            }),
            http.get('http://localhost/api/v1/decks/mine', () => {
                requests.created += 1
                return HttpResponse.json([])
            }),
            http.get('http://localhost/api/v1/decks', () => {
                requests.discover += 1
                return HttpResponse.json({
                    items: [],
                    page: 0,
                    size: 12,
                    totalElements: 0,
                    totalPages: 0,
                    hasNext: false,
                })
            }),
            http.get('http://localhost/api/v1/learning/decks', () => {
                requests.learningList += 1
                return HttpResponse.json([])
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
                    progress: { masteredCount: 0, totalCount: 0 },
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
                'http://localhost/api/v1/decks/12',
                () => new HttpResponse(null, { status: 204 }),
            ),
        )
        const user = userEvent.setup()
        renderPage('/decks/12/edit', {
            keepDeletionCachesSubscribed: true,
        })

        await screen.findByRole('heading', { name: 'Edit Deck' })
        await waitFor(() => {
            expect(requests).toEqual({
                deck: 1,
                created: 1,
                discover: 1,
                learningList: 1,
                learningDeck: 1,
                study: 1,
            })
        })

        await user.click(screen.getByRole('button', { name: 'Delete deck' }))
        await user.click(
            within(
                screen.getByRole('dialog', { name: 'Delete this deck?' }),
            ).getByRole('button', { name: 'Delete deck' }),
        )

        await screen.findByRole('heading', { name: 'Created destination' })
        await waitFor(() => {
            expect(requests.deck).toBeGreaterThanOrEqual(2)
            expect(requests.created).toBeGreaterThanOrEqual(2)
            expect(requests.discover).toBeGreaterThanOrEqual(2)
            expect(requests.learningList).toBeGreaterThanOrEqual(2)
            expect(requests.learningDeck).toBeGreaterThanOrEqual(2)
            expect(requests.study).toBeGreaterThanOrEqual(2)
        })
    })

    it("guards another user's deck", async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({
                    ...deck,
                    owner: { ...owner, id: 99 },
                }),
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

    it('rejects an invalid route id without rendering the form', () => {
        renderPage('/decks/not-a-number/edit')

        expect(
            screen.getByRole('heading', { name: 'Invalid deck' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Save changes' }),
        ).not.toBeInTheDocument()
    })

    it('retries a failed editor load', async () => {
        let requests = 0
        server.use(
            http.get('http://localhost/api/v1/decks/12', () => {
                requests += 1
                return requests === 1
                    ? HttpResponse.json(
                          { message: 'Temporary failure' },
                          { status: 500 },
                      )
                    : HttpResponse.json(deck)
            }),
        )
        const user = userEvent.setup()
        renderPage()

        await screen.findByRole('heading', {
            name: 'Unable to prepare deck editor',
        })
        await user.click(screen.getByRole('button', { name: 'Try again' }))

        expect(
            await screen.findByRole('heading', { name: 'Edit Deck' }),
        ).toBeInTheDocument()
        expect(requests).toBe(2)
    })

    it('cancels editing without sending an update', async () => {
        let updates = 0
        server.use(
            http.put('http://localhost/api/v1/decks/12', () => {
                updates += 1
                return HttpResponse.json(deck)
            }),
        )
        const user = userEvent.setup()
        renderPage()
        await screen.findByRole('heading', { name: 'Edit Deck' })

        await user.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(
            screen.getByRole('heading', { name: 'Manage deck destination' }),
        ).toBeInTheDocument()
        expect(updates).toBe(0)
    })

    it('blocks invalid input before sending an update', async () => {
        let updates = 0
        server.use(
            http.put('http://localhost/api/v1/decks/12', () => {
                updates += 1
                return HttpResponse.json(deck)
            }),
        )
        const user = userEvent.setup()
        renderPage()
        const title = await screen.findByRole('textbox', { name: 'Deck title' })

        await user.clear(title)
        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        expect(
            await screen.findByText('Deck title is required'),
        ).toBeInTheDocument()
        expect(updates).toBe(0)
    })

    it('shows server field validation without leaving the editor', async () => {
        server.use(
            http.put('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(
                    {
                        message: 'Validation failed',
                        errors: { title: 'A deck with this title exists' },
                    },
                    { status: 400 },
                ),
            ),
        )
        const user = userEvent.setup()
        renderPage()
        await screen.findByRole('heading', { name: 'Edit Deck' })

        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        expect(
            await screen.findByText('A deck with this title exists'),
        ).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Edit Deck' })).toBeVisible()
    })

    it('keeps update and delete failures inline', async () => {
        server.use(
            http.put('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(
                    { message: 'Temporary failure' },
                    { status: 500 },
                ),
            ),
            http.delete('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(
                    { message: 'Deck is locked' },
                    { status: 500 },
                ),
            ),
        )
        const user = userEvent.setup()
        renderPage()
        await screen.findByRole('heading', { name: 'Edit Deck' })

        await user.click(screen.getByRole('button', { name: 'Save changes' }))
        expect(
            await screen.findByText('Unable to update deck'),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Delete deck' }))
        const dialog = screen.getByRole('dialog', { name: 'Delete this deck?' })
        await user.click(
            within(dialog).getByRole('button', { name: 'Delete deck' }),
        )
        expect(
            await within(dialog).findByText('Unable to delete deck'),
        ).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Edit Deck' })).toBeVisible()
    })

    it('cancels deletion without sending a delete request', async () => {
        let deletes = 0
        server.use(
            http.delete('http://localhost/api/v1/decks/12', () => {
                deletes += 1
                return new HttpResponse(null, { status: 204 })
            }),
        )
        const user = userEvent.setup()
        renderPage()
        await screen.findByRole('heading', { name: 'Edit Deck' })

        await user.click(screen.getByRole('button', { name: 'Delete deck' }))
        const dialog = screen.getByRole('dialog', { name: 'Delete this deck?' })
        await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

        expect(deletes).toBe(0)
        expect(
            screen.queryByRole('dialog', { name: 'Delete this deck?' }),
        ).not.toBeInTheDocument()
    })

    it('invalidates and refreshes an active deck cache after saving', async () => {
        let deckRequests = 0
        server.use(
            http.get('http://localhost/api/v1/decks/12', () => {
                deckRequests += 1
                return HttpResponse.json(deck)
            }),
            http.put('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({ ...deck, title: 'Updated deck' }),
            ),
        )
        const user = userEvent.setup()
        renderPage('/decks/12/edit', { keepDeckSubscribed: true })
        await screen.findByRole('heading', { name: 'Edit Deck' })

        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        await screen.findByRole('heading', {
            name: 'Manage deck destination',
        })
        await waitFor(() => expect(deckRequests).toBeGreaterThanOrEqual(2))
    })
})
