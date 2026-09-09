import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

describe('AppShell', () => {
    it('renders protected content inside the reduced Learning navigation shell', () => {
        render(
            <MemoryRouter initialEntries={['/learning']}>
                <Routes>
                    <Route element={<AppShell />}>
                        <Route
                            path="/learning"
                            element={<h1>Learning content</h1>}
                        />
                    </Route>
                </Routes>
            </MemoryRouter>,
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
