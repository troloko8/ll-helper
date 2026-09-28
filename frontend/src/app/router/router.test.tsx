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
            http.get('http://localhost/api/v1/decks/:deckId/cards', () =>
                HttpResponse.json([]),
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
                    cards: [],
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
    ])('blocks %s while the session is initializing', (path) => {
        renderRoute(path)

        expect(
            screen.getByRole('heading', {
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

    it.each(['/onboarding/profile', '/', '/missing-page'])(
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

    it.each(['/login', '/register', '/', '/missing-page'])(
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

    it('allows an authenticated user to reach learning', () => {
        const { router } = renderRoute('/learning', 'authenticated')

        expect(router.state.location.pathname).toBe('/learning')
        expect(
            screen.getByRole('navigation', { name: 'Primary navigation' }),
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
            screen.getByRole('button', { name: 'Start learning' }),
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
            screen.getByRole('button', { name: 'Start learning' }),
        ).toBeInTheDocument()
    })

    it('shows not found to an authenticated user at an unknown URL', async () => {
        renderRoute('/missing-page', 'authenticated')

        expect(
            await screen.findByRole('heading', { name: 'Page not found' }),
        ).toBeInTheDocument()
    })
})
