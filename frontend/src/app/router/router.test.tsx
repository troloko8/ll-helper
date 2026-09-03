import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createAppStore } from '../store'
import { appRoutes } from './router'

function renderRoute(path: string) {
    const router = createMemoryRouter(appRoutes, {
        initialEntries: [path],
    })

    render(
        <Provider store={createAppStore()}>
            <RouterProvider router={router} />
        </Provider>,
    )
}

describe('router', () => {
    it('renders the not-found page for an unknown URL', async () => {
        renderRoute('/missing-page')

        expect(
            await screen.findByRole('heading', { name: 'Page not found' }),
        ).toBeInTheDocument()
        expect(
            screen.getByText('The page you requested does not exist.'),
        ).toBeInTheDocument()
    })

    it('renders the login page at /login', async () => {
        renderRoute('/login')

        expect(
            await screen.findByRole('heading', { name: 'LLHelper' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Sign In' }),
        ).toBeInTheDocument()
    })

    it('renders the register page at /register', async () => {
        renderRoute('/register')

        expect(
            await screen.findByRole('heading', { name: 'Create Account' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Create Account' }),
        ).toBeInTheDocument()
    })

    it('renders the complete-profile page at /onboarding/profile', async () => {
        renderRoute('/onboarding/profile')

        expect(
            await screen.findByRole('heading', {
                name: 'Complete Your Profile',
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Initialize Profile' }),
        ).toBeInTheDocument()
    })
})
