import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import {
    sessionAuthenticated,
    sessionCleared,
    sessionNeedsProfile,
} from '@/entities/session'
import { server } from '@/shared/lib/test'
import { createAppStore } from '../store'
import { appRoutes } from './router'

type ResolvedSessionStatus = 'anonymous' | 'needsProfile' | 'authenticated'

const sessionActions = {
    anonymous: sessionCleared,
    needsProfile: sessionNeedsProfile,
    authenticated: sessionAuthenticated,
} as const

function renderRoute(path: string, status?: ResolvedSessionStatus) {
    const store = createAppStore()

    if (status) {
        store.dispatch(sessionActions[status]())
    }

    const router = createMemoryRouter(appRoutes, {
        initialEntries: [path],
    })

    render(
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>,
    )

    return { router, store }
}

describe('router session boundaries', () => {
    beforeEach(() => {
        server.use(
            http.get('http://localhost/api/v1/decks/mine', () =>
                HttpResponse.json([]),
            ),
            http.get('http://localhost/api/v1/decks', () =>
                HttpResponse.json([]),
            ),
            http.get('http://localhost/api/v1/learning/decks', () =>
                HttpResponse.json([]),
            ),
            http.get(
                'http://localhost/api/v1/learning/decks/:deckId',
                ({ params }) =>
                    HttpResponse.json({
                        deckId: Number(params.deckId),
                        title: `Deck ${params.deckId}`,
                        sourceLanguage: 'ES',
                        targetLanguage: 'EN',
                        enrolledAt: '2026-09-01T10:00:00Z',
                        lastStudiedAt: null,
                        progress: { masteredCount: 0, totalCount: 0 },
                        cards: [],
                    }),
            ),
            http.get('http://localhost/api/v1/users/me', () =>
                HttpResponse.json({
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
                }),
            ),
            http.get('http://localhost/api/v1/decks/:deckId', () =>
                HttpResponse.json({
                    id: 12,
                    title: 'Spanish Core 1000',
                    description: null,
                    sourceLanguage: 'ES',
                    targetLanguage: 'EN',
                    createdAt: '2026-09-01T10:00:00Z',
                    updatedAt: '2026-09-01T10:00:00Z',
                    owner: {
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
                    },
                    isPublic: true,
                    isEnrolled: false,
                    cards: [
                        {
                            id: 701,
                            deckId: 12,
                            title: 'hola',
                            definition: null,
                            synonyms: null,
                            examples: null,
                            translation: 'hello',
                            createdAt: '2026-09-01T10:00:00Z',
                            updatedAt: '2026-09-01T10:00:00Z',
                        },
                    ],
                }),
            ),
        )
    })

    it.each([
        '/login',
        '/register',
        '/onboarding/profile',
        '/',
        '/missing-page',
    ])('blocks %s while the session is initializing', async (path) => {
        renderRoute(path)

        expect(
            await screen.findByRole('heading', {
                name: 'Preparing your workspace',
            }),
        ).toBeInTheDocument()
        expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    })

    it('allows an anonymous user to open login', async () => {
        renderRoute('/login', 'anonymous')

        expect(
            await screen.findByRole('heading', { name: 'LLHelper' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Sign In' }),
        ).toBeInTheDocument()
    })

    it('allows an anonymous user to open register', async () => {
        renderRoute('/register', 'anonymous')

        expect(
            await screen.findByRole('heading', { name: 'Create Account' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Create Account' }),
        ).toBeInTheDocument()
    })

    it.each(['/onboarding/profile', '/', '/missing-page', '/discover'])(
        'redirects an anonymous user from %s to login',
        async (path) => {
            const { router } = renderRoute(path, 'anonymous')

            await waitFor(() => {
                expect(router.state.location.pathname).toBe('/login')
            })
        },
    )

    it('allows a user who needs a profile to open onboarding', async () => {
        renderRoute('/onboarding/profile', 'needsProfile')

        expect(
            await screen.findByRole('heading', {
                name: 'Complete Your Profile',
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Initialize Profile' }),
        ).toBeInTheDocument()
    })

    it.each(['/login', '/register', '/', '/missing-page', '/discover'])(
        'redirects a user who needs a profile from %s to onboarding',
        async (path) => {
            const { router } = renderRoute(path, 'needsProfile')

            await waitFor(() => {
                expect(router.state.location.pathname).toBe(
                    '/onboarding/profile',
                )
            })
        },
    )

    it.each(['/login', '/register', '/onboarding/profile'])(
        'redirects an authenticated user from %s to learning',
        async (path) => {
            const { router } = renderRoute(path, 'authenticated')

            await waitFor(() => {
                expect(router.state.location.pathname).toBe('/learning')
            })
        },
    )

    it('redirects the authenticated root route to learning', async () => {
        const { router } = renderRoute('/', 'authenticated')

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/learning')
        })
    })

    it('allows an authenticated user to reach learning', async () => {
        const { router } = renderRoute('/learning', 'authenticated')

        expect(router.state.location.pathname).toBe('/learning')
        expect(
            await screen.findByRole('navigation', {
                name: 'Primary navigation',
            }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('heading', { name: 'Preparing your workspace' }),
        ).not.toBeInTheDocument()
    })

    it('allows an authenticated user to reach created decks', async () => {
        const { router } = renderRoute('/created', 'authenticated')

        expect(router.state.location.pathname).toBe('/created')
        expect(
            await screen.findByRole('heading', { name: 'Created' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Create New Deck' }),
        ).toHaveAttribute('href', '/decks/new')
    })

    it('allows an authenticated user to reach Discover', async () => {
        const { router } = renderRoute('/discover', 'authenticated')

        expect(router.state.location.pathname).toBe('/discover')
        expect(
            await screen.findByRole('heading', { name: 'Discover' }),
        ).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', {
                name: 'No public decks yet',
            }),
        ).toBeInTheDocument()
    })

    it('opens Public Deck Details from a Discover card', async () => {
        server.use(
            http.get('http://localhost/api/v1/decks', () =>
                HttpResponse.json([
                    {
                        id: 12,
                        title: 'Spanish Core 1000',
                        sourceLanguage: 'ES',
                        targetLanguage: 'EN',
                        owner: {
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
                        },
                        cardCount: 10,
                        isEnrolled: false,
                    },
                ]),
            ),
        )
        const user = userEvent.setup()
        const { router } = renderRoute('/discover', 'authenticated')

        await user.click(
            await screen.findByRole('link', {
                name: 'Open Spanish Core 1000',
            }),
        )

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/decks/12')
        })
        expect(
            await screen.findByRole('heading', { name: 'Spanish Core 1000' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Start Learning' }),
        ).toBeInTheDocument()
    })

    it('auto-enrolls from Discover, opens Study, and does not enroll again after reopening', async () => {
        let enrolled = false
        let enrollRequests = 0
        const publicDeck = {
            id: 12,
            title: 'Spanish Core 1000',
            sourceLanguage: 'ES',
            targetLanguage: 'EN',
            owner: {
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
            },
            cardCount: 1,
        }
        const contentCard = {
            id: 701,
            deckId: 12,
            title: 'hola',
            definition: 'A common greeting.',
            synonyms: null,
            examples: null,
            translation: 'hello',
            createdAt: '2026-09-01T10:00:00Z',
            updatedAt: '2026-09-01T10:00:00Z',
        }
        server.use(
            http.get('http://localhost/api/v1/decks', () =>
                HttpResponse.json([{ ...publicDeck, isEnrolled: enrolled }]),
            ),
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({
                    ...publicDeck,
                    description: null,
                    createdAt: '2026-09-01T10:00:00Z',
                    updatedAt: '2026-09-01T10:00:00Z',
                    isPublic: true,
                    isEnrolled: enrolled,
                    cards: [contentCard],
                }),
            ),
            http.post('http://localhost/api/v1/decks/12/enroll', () => {
                enrollRequests += 1
                enrolled = true
                return HttpResponse.json({ userDeckId: 501 }, { status: 201 })
            }),
            http.get('http://localhost/api/v1/decks/12/study', () =>
                HttpResponse.json({
                    deckId: 12,
                    deckTitle: publicDeck.title,
                    cards: [
                        {
                            id: contentCard.id,
                            title: contentCard.title,
                            definition: contentCard.definition,
                            synonyms: null,
                            examples: null,
                            translation: contentCard.translation,
                            progress: {
                                status: 'NEW',
                                timesSeen: 0,
                                timesCorrect: 0,
                                timesWrong: 0,
                                correctStreak: 0,
                            },
                        },
                    ],
                }),
            ),
        )
        const user = userEvent.setup()
        const { router } = renderRoute('/discover', 'authenticated')

        await user.click(
            await screen.findByRole('link', {
                name: 'Open Spanish Core 1000',
            }),
        )
        await user.click(
            await screen.findByRole('button', { name: 'Start Learning' }),
        )

        expect(
            await screen.findByRole('heading', { name: 'A common greeting.' }),
        ).toBeInTheDocument()
        expect(router.state.location.pathname).toBe('/study/12')

        const navigation = screen.getByRole('navigation', {
            name: 'Primary navigation',
        })
        await user.click(
            within(navigation).getByRole('link', { name: 'Discover' }),
        )
        expect(await screen.findByText('Enrolled')).toBeInTheDocument()

        await user.click(
            screen.getByRole('link', { name: 'Open Spanish Core 1000' }),
        )
        expect(
            await screen.findByRole('button', { name: 'Start Learning' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Enroll' }),
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Start Learning' }))
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/study/12')
        })
        expect(enrollRequests).toBe(1)
    })

    it('keeps standalone Enroll on details and refreshes Discover and Learning caches', async () => {
        let enrolled = false
        let learningRequests = 0
        const learningDeck = {
            deckId: 12,
            title: 'Spanish Core 1000',
            sourceLanguage: 'ES',
            targetLanguage: 'EN',
            enrolledAt: '2026-10-03T10:00:00Z',
            lastStudiedAt: null,
            progress: { masteredCount: 0, totalCount: 1 },
        }
        const owner = {
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
        const learningCard = {
            id: 701,
            title: 'hola',
            definition: null,
            synonyms: null,
            examples: null,
            translation: 'hello',
            progress: {
                status: 'NEW',
                timesSeen: 0,
                timesCorrect: 0,
                timesWrong: 0,
                correctStreak: 0,
            },
        }
        server.use(
            http.get('http://localhost/api/v1/decks', () =>
                HttpResponse.json([
                    {
                        id: 12,
                        title: learningDeck.title,
                        sourceLanguage: 'ES',
                        targetLanguage: 'EN',
                        owner,
                        cardCount: 1,
                        isEnrolled: enrolled,
                    },
                ]),
            ),
            http.get('http://localhost/api/v1/decks/12', () =>
                HttpResponse.json({
                    id: 12,
                    title: learningDeck.title,
                    description: null,
                    sourceLanguage: 'ES',
                    targetLanguage: 'EN',
                    createdAt: '2026-09-01T10:00:00Z',
                    updatedAt: '2026-09-01T10:00:00Z',
                    owner,
                    isPublic: true,
                    isEnrolled: enrolled,
                    cards: [
                        {
                            ...learningCard,
                            deckId: 12,
                            createdAt: '2026-09-01T10:00:00Z',
                            updatedAt: '2026-09-01T10:00:00Z',
                        },
                    ],
                }),
            ),
            http.get('http://localhost/api/v1/learning/decks', () => {
                learningRequests += 1
                return HttpResponse.json(enrolled ? [learningDeck] : [])
            }),
            http.get('http://localhost/api/v1/learning/decks/12', () =>
                HttpResponse.json({ ...learningDeck, cards: [learningCard] }),
            ),
            http.post('http://localhost/api/v1/decks/12/enroll', () => {
                enrolled = true
                return HttpResponse.json({ userDeckId: 501 }, { status: 201 })
            }),
        )
        const user = userEvent.setup()
        const { router } = renderRoute('/discover', 'authenticated')
        const navigation = await screen.findByRole('navigation', {
            name: 'Primary navigation',
        })

        await user.click(
            within(navigation).getByRole('link', { name: 'Learning' }),
        )
        expect(
            await screen.findByRole('heading', {
                name: 'No learning decks yet',
            }),
        ).toBeInTheDocument()
        await user.click(
            within(navigation).getByRole('link', { name: 'Discover' }),
        )
        await user.click(
            await screen.findByRole('link', {
                name: 'Open Spanish Core 1000',
            }),
        )
        await user.click(await screen.findByRole('button', { name: 'Enroll' }))

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/decks/12')
            expect(
                screen.queryByRole('button', { name: 'Enroll' }),
            ).not.toBeInTheDocument()
        })

        await user.click(
            within(navigation).getByRole('link', { name: 'Discover' }),
        )
        expect(await screen.findByText('Enrolled')).toBeInTheDocument()
        await user.click(
            within(navigation).getByRole('link', { name: 'Learning' }),
        )
        expect(
            await screen.findByRole('heading', { name: 'Spanish Core 1000' }),
        ).toBeInTheDocument()
        expect(learningRequests).toBeGreaterThanOrEqual(2)

        await user.click(
            screen.getByRole('link', { name: /Spanish Core 1000/ }),
        )
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/learning/12')
        })
        expect(
            await screen.findByRole('heading', { name: 'Spanish Core 1000' }),
        ).toBeInTheDocument()
    })

    it('refreshes Created after creating a deck without a browser reload', async () => {
        let ownedDeckRequests = 0
        let ownedDecks: Array<{
            id: number
            title: string
            sourceLanguage: string
            targetLanguage: string
            isPublic: boolean
            cardCount: number
        }> = []
        const createdDeck = {
            id: 73,
            title: 'Travel Japanese',
            description: '',
            sourceLanguage: 'EN',
            targetLanguage: 'JA',
            createdAt: '2026-09-28T10:00:00Z',
            updatedAt: '2026-09-28T10:00:00Z',
            owner: {
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
            },
            isPublic: true,
            cards: [],
        }
        server.use(
            http.get('http://localhost/api/v1/decks/mine', () => {
                ownedDeckRequests += 1
                return HttpResponse.json(ownedDecks)
            }),
            http.post('http://localhost/api/v1/decks', () => {
                ownedDecks = [
                    {
                        id: createdDeck.id,
                        title: createdDeck.title,
                        sourceLanguage: createdDeck.sourceLanguage,
                        targetLanguage: createdDeck.targetLanguage,
                        isPublic: createdDeck.isPublic,
                        cardCount: 0,
                    },
                ]
                return HttpResponse.json(createdDeck, { status: 201 })
            }),
            http.get('http://localhost/api/v1/decks/73', () =>
                HttpResponse.json(createdDeck),
            ),
        )
        const user = userEvent.setup()
        const { router } = renderRoute('/created', 'authenticated')

        expect(
            await screen.findByRole('heading', {
                name: 'No created decks yet',
            }),
        ).toBeInTheDocument()

        await user.click(screen.getByRole('link', { name: 'Create New Deck' }))
        await user.type(
            await screen.findByRole('textbox', { name: 'Deck title' }),
            createdDeck.title,
        )
        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Target language' }),
            'JA',
        )
        await user.click(screen.getByRole('button', { name: 'Create Deck' }))

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/decks/73/manage')
        })

        const desktopNavigation = screen.getByRole('navigation', {
            name: 'Primary navigation',
        })
        await user.click(
            within(desktopNavigation).getByRole('link', { name: 'Created' }),
        )

        expect(
            await screen.findByRole('heading', { name: createdDeck.title }),
        ).toBeInTheDocument()
        expect(ownedDeckRequests).toBe(2)
    })

    it('allows an authenticated user to reach learning deck details', async () => {
        const { router } = renderRoute('/learning/12', 'authenticated')

        expect(router.state.location.pathname).toBe('/learning/12')
        expect(
            await screen.findByRole('heading', { name: 'Deck 12' }),
        ).toBeInTheDocument()
    })

    it('opens Study from the Learning list through deck details', async () => {
        let reviewed = false
        let learningListRequests = 0
        let learningDetailRequests = 0
        const learningCard = {
            id: 701,
            title: 'hola',
            definition: 'A Spanish greeting.',
            synonyms: null,
            examples: ['Hola, ¿cómo estás?'],
            translation: 'hello',
            progress: {
                status: 'NEW',
                timesSeen: 0,
                timesCorrect: 0,
                timesWrong: 0,
                correctStreak: 0,
            },
        }

        server.use(
            http.get('http://localhost/api/v1/learning/decks', () => {
                learningListRequests += 1
                return HttpResponse.json([
                    {
                        deckId: 12,
                        title: 'Spanish Core 1000',
                        sourceLanguage: 'ES',
                        targetLanguage: 'EN',
                        enrolledAt: '2026-09-01T10:00:00Z',
                        lastStudiedAt: reviewed ? '2026-10-04T10:00:00Z' : null,
                        progress: { masteredCount: 0, totalCount: 1 },
                    },
                ])
            }),
            http.get('http://localhost/api/v1/learning/decks/12', () => {
                learningDetailRequests += 1
                return HttpResponse.json({
                    deckId: 12,
                    title: 'Spanish Core 1000',
                    sourceLanguage: 'ES',
                    targetLanguage: 'EN',
                    enrolledAt: '2026-09-01T10:00:00Z',
                    lastStudiedAt: null,
                    progress: { masteredCount: 0, totalCount: 1 },
                    cards: [
                        {
                            ...learningCard,
                            progress: reviewed
                                ? {
                                      status: 'LEARNING',
                                      timesSeen: 1,
                                      timesCorrect: 1,
                                      timesWrong: 0,
                                      correctStreak: 1,
                                  }
                                : learningCard.progress,
                        },
                    ],
                })
            }),
            http.get('http://localhost/api/v1/decks/12/study', () =>
                HttpResponse.json({
                    deckId: 12,
                    deckTitle: 'Spanish Core 1000',
                    cards: [learningCard],
                }),
            ),
            http.post(
                'http://localhost/api/v1/cards/701/review',
                async ({ request }) => {
                    expect(await request.json()).toEqual({
                        userAnswer: 'hola',
                    })
                    reviewed = true
                    return HttpResponse.json({
                        correct: true,
                        correctAnswer: 'hola',
                        status: 'LEARNING',
                        correctStreak: 1,
                        totalCorrect: 1,
                    })
                },
            ),
        )
        const user = userEvent.setup()
        const { router } = renderRoute('/learning', 'authenticated')

        await user.click(
            await screen.findByRole('link', { name: /Spanish Core 1000/ }),
        )

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/learning/12')
        })

        await user.click(await screen.findByRole('link', { name: 'Study now' }))

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/study/12')
        })
        expect(
            await screen.findByRole('textbox', { name: 'Your answer' }),
        ).toBeInTheDocument()

        await user.type(
            screen.getByRole('textbox', { name: 'Your answer' }),
            'hola',
        )
        await user.click(screen.getByRole('button', { name: 'Check answer' }))

        expect(
            await screen.findByRole('heading', { name: 'Correct' }),
        ).toBeInTheDocument()
        expect(screen.getByText(/Status: learning/)).toBeInTheDocument()

        await user.click(screen.getByRole('link', { name: 'Back to deck' }))

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/learning/12')
        })
        const progress = await screen.findByRole('region', {
            name: 'Deck progress',
        })
        expect(progress).toHaveTextContent('Mastered0')
        expect(progress).toHaveTextContent('Learning1')
        expect(progress).toHaveTextContent('New0')
        expect(
            within(
                screen.getByRole('region', { name: 'Card inventory' }),
            ).getByText('Learning'),
        ).toBeInTheDocument()

        await user.click(
            within(
                screen.getByRole('navigation', { name: 'Breadcrumb' }),
            ).getByRole('link', { name: 'Learning' }),
        )

        expect(await screen.findByText('Continue learning')).toBeInTheDocument()
        expect(screen.getByText('0 / 1 mastered')).toBeInTheDocument()
        expect(learningDetailRequests).toBeGreaterThanOrEqual(2)
        expect(learningListRequests).toBeGreaterThanOrEqual(2)
    })

    it('allows an authenticated user to reach Create Deck', async () => {
        const { router } = renderRoute('/decks/new', 'authenticated')

        expect(router.state.location.pathname).toBe('/decks/new')
        expect(
            await screen.findByRole('heading', { name: 'Create Deck' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Create Deck' }),
        ).toBeInTheDocument()
    })

    it('allows an authenticated owner to reach deck management', async () => {
        const { router } = renderRoute('/decks/12/manage', 'authenticated')

        expect(router.state.location.pathname).toBe('/decks/12/manage')
        expect(
            await screen.findByRole('heading', { name: 'Spanish Core 1000' }),
        ).toBeInTheDocument()
    })

    it('allows an authenticated user to open public deck details directly', async () => {
        const { router } = renderRoute('/decks/12', 'authenticated')

        expect(router.state.location.pathname).toBe('/decks/12')
        expect(
            await screen.findByRole('heading', { name: 'Spanish Core 1000' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Start Learning' }),
        ).toBeInTheDocument()
    })

    it('shows not found to an authenticated user at an unknown URL', async () => {
        renderRoute('/missing-page', 'authenticated')

        expect(
            await screen.findByRole('heading', { name: 'Page not found' }),
        ).toBeInTheDocument()
    })
})
