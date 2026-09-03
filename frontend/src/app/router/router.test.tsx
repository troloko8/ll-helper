import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { appRoutes } from './router'

describe('router', () => {
    it('renders the not-found page for an unknown URL', async () => {
        const router = createMemoryRouter(appRoutes, {
            initialEntries: ['/missing-page'],
        })

        render(<RouterProvider router={router} />)

        expect(
            await screen.findByRole('heading', { name: 'Page not found' }),
        ).toBeInTheDocument()
        expect(
            screen.getByText('The page you requested does not exist.'),
        ).toBeInTheDocument()
    })
})
