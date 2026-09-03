import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RouterErrorSurface } from './router-error-surface'

function renderRouteError(error: unknown) {
    const router = createMemoryRouter([
        {
            path: '/',
            loader: () => {
                throw error
            },
            element: <div>Route content</div>,
            errorElement: <RouterErrorSurface />,
        },
    ])

    render(<RouterProvider router={router} />)
}

describe('RouterErrorSurface', () => {
    it('presents a not-found response without exposing response details', async () => {
        renderRouteError(
            new Response('Internal response details', {
                status: 404,
                statusText: 'Not Found',
            }),
        )

        expect(
            await screen.findByRole('heading', { name: 'Page not found' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByText('Internal response details'),
        ).not.toBeInTheDocument()
    })

    it('presents a safe fallback for an unexpected route failure', async () => {
        renderRouteError(new Error('Sensitive implementation details'))

        expect(
            await screen.findByRole('heading', {
                name: 'Unable to load this page',
            }),
        ).toBeInTheDocument()
        expect(
            screen.queryByText('Sensitive implementation details'),
        ).not.toBeInTheDocument()
    })
})
