import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApplicationErrorBoundary } from './application-error-boundary'

function BrokenContent(): never {
    throw new Error('Render failed')
}

describe('ApplicationErrorBoundary', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('replaces an unhandled render failure with a recovery surface', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined)

        render(
            <ApplicationErrorBoundary>
                <BrokenContent />
            </ApplicationErrorBoundary>,
        )

        expect(
            screen.getByRole('heading', { name: 'Something went wrong' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Reload application' }),
        ).toBeInTheDocument()
        expect(screen.queryByText('Render failed')).not.toBeInTheDocument()
    })
})
