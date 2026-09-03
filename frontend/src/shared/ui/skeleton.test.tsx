import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from './skeleton'

describe('Skeleton', () => {
    it('is decorative by default and preserves explicit dimensions', () => {
        render(
            <Skeleton
                data-testid="skeleton"
                width="60%"
                style={{ height: 24 }}
            />,
        )

        const skeleton = screen.getByTestId('skeleton')

        expect(skeleton).toHaveAttribute('aria-hidden', 'true')
        expect(skeleton).toHaveStyle({ width: '60%', height: '24px' })
    })
})
