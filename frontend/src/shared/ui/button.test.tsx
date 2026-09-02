import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('is disabled and communicates its busy state while loading', () => {
    render(
      <Button isLoading loadingLabel="Saving">
        Save
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Saving' })

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('uses button as the safe default type', () => {
    render(<Button>Continue</Button>)

    expect(screen.getByRole('button', { name: 'Continue' })).toHaveAttribute(
      'type',
      'button',
    )
  })

  it('passes a React 19 ref prop to the native button', () => {
    const ref = createRef<HTMLButtonElement>()

    render(<Button ref={ref}>Focus target</Button>)

    expect(ref.current).toBe(screen.getByRole('button', { name: 'Focus target' }))
  })
})
