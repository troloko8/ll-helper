import { Provider } from 'react-redux'
import {
    MemoryRouter,
    Route,
    Routes,
    createMemoryRouter,
    RouterProvider,
} from 'react-router-dom'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGetCurrentUserQuery, userApi } from '@/entities/user'
import { createApiTestStore, server } from '@/shared/lib/test'
import { AppShell } from './app-shell'

const currentUser = {
    id: 42,
    username: 'learner',
    firstName: 'Test',
    lastName: 'Learner',
    nativeLanguage: 'en',
    targetLanguage: 'ru',
    avatarUrl: null,
    uiLanguage: 'en',
    createdAt: '2026-09-03T00:00:00Z',
    updatedAt: '2026-09-03T00:00:00Z',
}

function ProfileConsumer() {
    const { data } = useGetCurrentUserQuery()
    return <h1>{data?.username ?? 'Loading profile'}</h1>
}

describe('AppShell', () => {
    beforeEach(() => {
        server.use(
            http.get('http://localhost/api/v1/users/me', () =>
                HttpResponse.json(currentUser),
            ),
        )
    })
    afterEach(() => vi.useRealTimers())

    it('retains the bootstrap profile while routes without profile consumers are open', async () => {
        let requests = 0
        server.use(
            http.get('http://localhost/api/v1/users/me', () => {
                requests += 1
                return HttpResponse.json(currentUser)
            }),
        )
        const store = createApiTestStore()
        const bootstrap = store.dispatch(
            userApi.endpoints.getCurrentUser.initiate(),
        )
        await bootstrap.unwrap()
        vi.useFakeTimers()
        bootstrap.unsubscribe()
        const router = createMemoryRouter(
            [
                {
                    element: <AppShell />,
                    children: [
                        {
                            path: '/learning',
                            element: <h1>Learning content</h1>,
                        },
                        { path: '/profile', element: <ProfileConsumer /> },
                    ],
                },
            ],
            { initialEntries: ['/learning'] },
        )
        const view = render(
            <Provider store={store}>
                <RouterProvider router={router} />
            </Provider>,
        )
        await act(async () => {
            await vi.advanceTimersByTimeAsync(61_000)
        })
        await act(async () => {
            await router.navigate('/profile')
        })
        expect(
            screen.getByRole('heading', { name: 'learner' }),
        ).toBeInTheDocument()
        expect(requests).toBe(1)
        view.unmount()
    })
    it('renders the working Learning, Created, and Discover navigation entries', () => {
        render(
            <Provider store={createApiTestStore()}>
                <MemoryRouter initialEntries={['/learning']}>
                    <Routes>
                        <Route element={<AppShell />}>
                            <Route
                                path="/learning"
                                element={<h1>Learning content</h1>}
                            />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </Provider>,
        )

        expect(
            screen.getByRole('heading', { name: 'Learning content' }),
        ).toBeInTheDocument()

        const desktopNavigation = screen.getByRole('navigation', {
            name: 'Primary navigation',
        })
        const mobileNavigation = screen.getByRole('navigation', {
            name: 'Mobile navigation',
        })

        for (const navigation of [desktopNavigation, mobileNavigation]) {
            expect(
                within(navigation).getByRole('link', { name: 'Learning' }),
            ).toHaveAttribute('aria-current', 'page')
            expect(
                within(navigation).getByRole('link', { name: 'Created' }),
            ).toHaveAttribute('href', '/created')
            expect(
                within(navigation).getByRole('link', { name: 'Created' }),
            ).not.toHaveAttribute('aria-current')
            expect(
                within(navigation).getByRole('link', { name: 'Discover' }),
            ).toHaveAttribute('href', '/discover')
            expect(
                within(navigation).getByRole('link', { name: 'Discover' }),
            ).not.toHaveAttribute('aria-current')
            expect(within(navigation).getAllByRole('link')).toHaveLength(3)
        }

        expect(screen.queryByText('Study')).not.toBeInTheDocument()
        expect(screen.queryByText('Progress')).not.toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: 'Log out' })).toHaveLength(
            2,
        )
        expect(
            screen.getByRole('link', { name: 'Skip to main content' }),
        ).toHaveAttribute('href', '#main-content')
        expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    })

    it('moves focus to main content after client-side navigation', async () => {
        const user = userEvent.setup()
        render(
            <Provider store={createApiTestStore()}>
                <MemoryRouter initialEntries={['/learning']}>
                    <Routes>
                        <Route element={<AppShell />}>
                            <Route
                                path="/learning"
                                element={<h1>Learning content</h1>}
                            />
                            <Route
                                path="/created"
                                element={<h1>Created content</h1>}
                            />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </Provider>,
        )

        const desktopNavigation = screen.getByRole('navigation', {
            name: 'Primary navigation',
        })
        await user.click(
            within(desktopNavigation).getByRole('link', { name: 'Created' }),
        )

        expect(
            screen.getByRole('heading', { name: 'Created content' }),
        ).toBeInTheDocument()
        expect(screen.getByRole('main')).toHaveFocus()
    })

    it.each([
        ['/learning/12', 'Learning'],
        ['/learning/12/', 'Learning'],
        ['/study/12', 'Learning'],
        ['/study/12/', 'Learning'],
        ['/decks/new', 'Created'],
        ['/decks/new/', 'Created'],
        ['/created/', 'Created'],
        ['/decks/12/manage', 'Created'],
        ['/decks/12/cards/new', 'Created'],
        ['/decks/12', 'Discover'],
        ['/discover/', 'Discover'],
    ])('marks %s as part of the %s navigation section', (route, label) => {
        render(
            <Provider store={createApiTestStore()}>
                <MemoryRouter initialEntries={[route]}>
                    <Routes>
                        <Route element={<AppShell />}>
                            <Route path="*" element={<h1>Nested content</h1>} />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </Provider>,
        )

        for (const navigationName of [
            'Primary navigation',
            'Mobile navigation',
        ]) {
            expect(
                within(
                    screen.getByRole('navigation', { name: navigationName }),
                ).getByRole('link', { name: label }),
            ).toHaveAttribute('aria-current', 'page')
        }
    })

    it.each([
        '/learning/12/extra',
        '/study/12/extra',
        '/decks/12/manage/extra',
        '/unknown',
    ])('does not mark a section active for unknown route %s', (route) => {
        render(
            <Provider store={createApiTestStore()}>
                <MemoryRouter initialEntries={[route]}>
                    <Routes>
                        <Route element={<AppShell />}>
                            <Route path="*" element={<h1>Not found</h1>} />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </Provider>,
        )

        for (const navigationName of [
            'Primary navigation',
            'Mobile navigation',
        ]) {
            const navigation = screen.getByRole('navigation', {
                name: navigationName,
            })
            expect(
                within(navigation).queryByRole('link', { current: 'page' }),
            ).not.toBeInTheDocument()
        }
    })

    it('marks Discover active in desktop and mobile navigation', () => {
        render(
            <Provider store={createApiTestStore()}>
                <MemoryRouter initialEntries={['/discover']}>
                    <Routes>
                        <Route element={<AppShell />}>
                            <Route
                                path="/discover"
                                element={<h1>Discover content</h1>}
                            />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </Provider>,
        )

        for (const navigationName of [
            'Primary navigation',
            'Mobile navigation',
        ]) {
            const navigation = screen.getByRole('navigation', {
                name: navigationName,
            })
            expect(
                within(navigation).getByRole('link', { name: 'Discover' }),
            ).toHaveAttribute('aria-current', 'page')
        }
    })

    it('marks Created active in desktop and mobile navigation', () => {
        render(
            <Provider store={createApiTestStore()}>
                <MemoryRouter initialEntries={['/created']}>
                    <Routes>
                        <Route element={<AppShell />}>
                            <Route
                                path="/created"
                                element={<h1>Created content</h1>}
                            />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </Provider>,
        )

        for (const navigationName of [
            'Primary navigation',
            'Mobile navigation',
        ]) {
            const navigation = screen.getByRole('navigation', {
                name: navigationName,
            })
            expect(
                within(navigation).getByRole('link', { name: 'Created' }),
            ).toHaveAttribute('aria-current', 'page')
        }
    })

    it('collapses My Decks and reopens it after mobile navigation changes the route', async () => {
        const user = userEvent.setup()
        render(
            <Provider store={createApiTestStore()}>
                <MemoryRouter initialEntries={['/learning']}>
                    <Routes>
                        <Route element={<AppShell />}>
                            <Route
                                path="/learning"
                                element={<h1>Learning content</h1>}
                            />
                            <Route
                                path="/created"
                                element={<h1>Created content</h1>}
                            />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </Provider>,
        )

        const desktopNavigation = screen.getByRole('navigation', {
            name: 'Primary navigation',
        })
        const trigger = within(desktopNavigation).getByRole('button', {
            name: 'My Decks',
        })

        expect(trigger).toHaveAttribute('aria-expanded', 'true')
        expect(
            within(desktopNavigation).getByRole('link', { name: 'Learning' }),
        ).toBeInTheDocument()

        await user.click(trigger)

        expect(trigger).toHaveAttribute('aria-expanded', 'false')
        expect(
            within(desktopNavigation).queryByRole('link', {
                name: 'Learning',
            }),
        ).not.toBeInTheDocument()

        const mobileNavigation = screen.getByRole('navigation', {
            name: 'Mobile navigation',
        })
        await user.click(
            within(mobileNavigation).getByRole('link', { name: 'Created' }),
        )

        expect(trigger).toHaveAttribute('aria-expanded', 'true')
        expect(
            within(desktopNavigation).getByRole('link', { name: 'Created' }),
        ).toHaveAttribute('aria-current', 'page')
    })
})
