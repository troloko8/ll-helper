import { Route, Routes } from 'react-router-dom'
import { HttpResponse, delay, http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/app/test'
import type { DeckDetailsResponseDto } from '@/entities/deck'
import { setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { PublicDeckDetailsPage } from './public-deck-details-page'

const deck: DeckDetailsResponseDto = {
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
    isEnrolled: false,
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
            <Route
                path="/study/:deckId"
                element={<h1>Study session destination</h1>}
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

    it('enrolls without a request body and starts studying', async () => {
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

        expect(
            await screen.findByRole('button', { name: 'Enroll' }),
        ).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Start Learning' }))

        expect(
            await screen.findByRole('heading', {
                name: 'Study session destination',
            }),
        ).toBeInTheDocument()
    })

    it('enrolls without starting a study session', async () => {
        let enrolled = false
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({ ...deck, isEnrolled: enrolled }),
            ),
            http.post('http://localhost/api/v1/decks/12/enroll', () => {
                enrolled = true
                return HttpResponse.json({ userDeckId: 501 }, { status: 201 })
            }),
        )
        const user = userEvent.setup()
        renderPublicDeck()

        await user.click(await screen.findByRole('button', { name: 'Enroll' }))

        await waitFor(() => {
            expect(
                screen.queryByRole('button', { name: 'Enroll' }),
            ).not.toBeInTheDocument()
        })
        expect(
            screen.getByRole('button', { name: 'Start Learning' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', {
                name: 'Medical Spanish Terminology',
            }),
        ).toBeInTheDocument()
    })

    it('uses server enrollment state on direct entry and starts studying without enrolling again', async () => {
        let enrollRequests = 0
        server.use(
            http.get('http://localhost/api/v1/decks/12', ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer learner-token',
                )
                return HttpResponse.json({ ...deck, isEnrolled: true })
            }),
            http.post('http://localhost/api/v1/decks/12/enroll', () => {
                enrollRequests += 1
                return HttpResponse.json({ userDeckId: 501 }, { status: 201 })
            }),
        )
        const user = userEvent.setup()
        renderPublicDeck('/decks/12')

        expect(
            await screen.findByRole('button', { name: 'Start Learning' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Enroll' }),
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Start Learning' }))

        expect(
            await screen.findByRole('heading', {
                name: 'Study session destination',
            }),
        ).toBeInTheDocument()
        expect(enrollRequests).toBe(0)
    })

    it('shows the starting state and disables both actions', async () => {
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
            await screen.findByRole('button', { name: 'Start Learning' }),
        )

        expect(
            await screen.findByRole('button', { name: 'Starting learning' }),
        ).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Enroll' })).toBeDisabled()
    })

    it('continues to Study after a 409 when refreshed detail confirms enrollment', async () => {
        let enrolled = false
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({ ...deck, isEnrolled: enrolled }),
            ),
            http.post('http://localhost/api/v1/decks/12/enroll', () => {
                enrolled = true
                return HttpResponse.json(
                    { message: 'Already enrolled' },
                    { status: 409 },
                )
            }),
        )
        const user = userEvent.setup()
        renderPublicDeck()

        await user.click(
            await screen.findByRole('button', { name: 'Start Learning' }),
        )

        expect(
            await screen.findByRole('heading', {
                name: 'Study session destination',
            }),
        ).toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('keeps standalone Enroll on details after a confirmed 409', async () => {
        let enrolled = false
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({ ...deck, isEnrolled: enrolled }),
            ),
            http.post('http://localhost/api/v1/decks/12/enroll', () => {
                enrolled = true
                return HttpResponse.json(
                    { message: 'Already enrolled' },
                    { status: 409 },
                )
            }),
        )
        const user = userEvent.setup()
        renderPublicDeck()

        await user.click(await screen.findByRole('button', { name: 'Enroll' }))

        await waitFor(() => {
            expect(
                screen.queryByRole('button', { name: 'Enroll' }),
            ).not.toBeInTheDocument()
        })
        expect(
            screen.getByRole('heading', {
                name: 'Medical Spanish Terminology',
            }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('heading', {
                name: 'Study session destination',
            }),
        ).not.toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('does not treat an unconfirmed 409 as successful enrollment', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(deck),
            ),
            http.post('http://localhost/api/v1/decks/12/enroll', () =>
                HttpResponse.json(
                    { message: 'Enrollment conflict' },
                    { status: 409 },
                ),
            ),
        )
        const user = userEvent.setup()
        renderPublicDeck()

        await user.click(
            await screen.findByRole('button', { name: 'Start Learning' }),
        )

        const errorTitle = await screen.findByText('Unable to start learning')
        expect(errorTitle.closest('[role="alert"]')).toBeInTheDocument()
        expect(
            screen.queryByRole('heading', {
                name: 'Study session destination',
            }),
        ).not.toBeInTheDocument()
    })

    it('shows a refetch error when a 409 enrollment cannot be reconciled', async () => {
        let detailRequests = 0
        server.use(
            http.get('http://localhost/api/v1/decks/12', () => {
                detailRequests += 1

                return detailRequests === 1
                    ? HttpResponse.json(deck)
                    : HttpResponse.json(
                          { message: 'Unable to refresh enrollment' },
                          { status: 500 },
                      )
            }),
            http.post('http://localhost/api/v1/decks/12/enroll', () =>
                HttpResponse.json(
                    { message: 'Enrollment conflict' },
                    { status: 409 },
                ),
            ),
        )
        const user = userEvent.setup()
        renderPublicDeck()

        await user.click(
            await screen.findByRole('button', { name: 'Start Learning' }),
        )

        const errorTitle = await screen.findByText('Unable to start learning')
        expect(errorTitle.closest('[role="alert"]')).toHaveTextContent(
            'Something went wrong on our side. Try again later.',
        )
        expect(
            screen.queryByRole('heading', {
                name: 'Study session destination',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not navigate after a non-conflict enrollment error', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json(deck),
            ),
            http.post('http://localhost/api/v1/decks/12/enroll', () =>
                HttpResponse.json(
                    { message: 'Enrollment unavailable' },
                    { status: 500 },
                ),
            ),
        )
        const user = userEvent.setup()
        renderPublicDeck()

        await user.click(
            await screen.findByRole('button', { name: 'Start Learning' }),
        )

        expect(
            await screen.findByText('Unable to start learning'),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('heading', {
                name: 'Study session destination',
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
        expect(
            screen.getByText('This deck has no cards to study yet.'),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Start Learning' }),
        ).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Enroll' })).toBeEnabled()
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
            screen.queryByRole('button', { name: 'Start Learning' }),
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Enroll' }),
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
