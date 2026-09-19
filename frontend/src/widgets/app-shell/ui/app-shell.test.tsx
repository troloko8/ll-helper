import { Provider } from 'react-redux'
import {
    MemoryRouter,
    Route,
    Routes,
    createMemoryRouter,
    RouterProvider,
} from 'react-router-dom'
import { act, render, screen, within } from '@testing-library/react'
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
    it('renders protected content inside the reduced Learning navigation shell', () => {
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
            expect(within(navigation).getAllByRole('link')).toHaveLength(1)
        }

        expect(screen.queryByText('Created')).not.toBeInTheDocument()
        expect(screen.queryByText('Discover')).not.toBeInTheDocument()
        expect(screen.queryByText('Study')).not.toBeInTheDocument()
        expect(screen.queryByText('Progress')).not.toBeInTheDocument()
    })
})
