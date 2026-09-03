import { act } from 'react'
import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { sessionAuthenticated, sessionCleared } from '@/entities/session'
import { renderWithProviders } from '@/app/test'
import { ProtectedRoute } from './protected-route'

function renderProtectedRoute(route: string) {
    return renderWithProviders(
        <Routes>
            <Route path="/" element={<ProtectedRoute />}>
                <Route index element={<div>Protected content</div>} />
            </Route>
            <Route path="/login" element={<div>Login page</div>} />
        </Routes>,
        { route },
    )
}

describe('ProtectedRoute', () => {
    it('renders no protected content while the session is initializing', () => {
        renderProtectedRoute('/')

        expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
        expect(screen.queryByText('Login page')).not.toBeInTheDocument()
    })

    it('redirects to /login when the session is anonymous', () => {
        const { store } = renderProtectedRoute('/')

        act(() => {
            store.dispatch(sessionCleared())
        })

        expect(screen.getByText('Login page')).toBeInTheDocument()
        expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })

    it('renders the nested route content when authenticated', () => {
        const { store } = renderProtectedRoute('/')

        act(() => {
            store.dispatch(sessionAuthenticated())
        })

        expect(screen.getByText('Protected content')).toBeInTheDocument()
    })
})
