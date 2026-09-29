import { Link, RouterProvider, createMemoryRouter } from 'react-router-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RouteLoading, RoutePending } from './route-loading'
import { RouterErrorSurface } from './router-error-surface'

function renderDelayedRoute(initialPath: string) {
    let resolve!: (value: { Component: () => React.JSX.Element }) => void
    let reject!: (error: Error) => void
    const module = new Promise<{ Component: () => React.JSX.Element }>(
        (res, rej) => {
            resolve = res
            reject = rej
        },
    )
    const router = createMemoryRouter(
        [
            {
                element: <RoutePending />,
                hydrateFallbackElement: <RouteLoading />,
                errorElement: <RouterErrorSurface />,
                children: [
                    {
                        path: '/',
                        element: <Link to="/delayed">Open page</Link>,
                    },
                    { path: '/delayed', lazy: () => module },
                ],
            },
        ],
        { initialEntries: [initialPath] },
    )
    render(<RouterProvider router={router} />)
    return {
        router,
        resolve: () => resolve({ Component: () => <h1>Loaded page</h1> }),
        reject,
    }
}

describe('lazy route boundaries', () => {
    it('shows a blocking initial fallback until the page module resolves', async () => {
        const { resolve } = renderDelayedRoute('/delayed')
        expect(
            screen.getByRole('heading', { name: 'Loading page' }),
        ).toBeInTheDocument()
        expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
        await act(async () => resolve())
        expect(
            await screen.findByRole('heading', { name: 'Loaded page' }),
        ).toBeInTheDocument()
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('keeps the current content and announces an in-app transition', async () => {
        const user = userEvent.setup()
        const { resolve, router } = renderDelayedRoute('/')
        await user.click(screen.getByRole('link', { name: 'Open page' }))
        expect(screen.getByRole('status')).toHaveTextContent('Loading page')
        expect(
            screen.getByRole('link', { name: 'Open page' }),
        ).toBeInTheDocument()
        await act(async () => resolve())
        await waitFor(() =>
            expect(router.state.location.pathname).toBe('/delayed'),
        )
        expect(
            screen.getByRole('heading', { name: 'Loaded page' }),
        ).toBeInTheDocument()
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it.each(['/', '/delayed'])(
        'offers manual recovery when a lazy module fails from %s',
        async (path) => {
            const { reject } = renderDelayedRoute(path)
            if (path === '/') {
                await userEvent
                    .setup()
                    .click(screen.getByRole('link', { name: 'Open page' }))
            }
            await act(async () =>
                reject(new Error('Internal chunk URL or stack')),
            )
            expect(
                await screen.findByRole('heading', {
                    name: 'Unable to load this page',
                }),
            ).toBeInTheDocument()
            expect(
                screen.getByRole('button', { name: 'Reload page' }),
            ).toBeInTheDocument()
            expect(
                screen.queryByText('Internal chunk URL or stack'),
            ).not.toBeInTheDocument()
            expect(screen.queryByRole('status')).not.toBeInTheDocument()
        },
    )
})
