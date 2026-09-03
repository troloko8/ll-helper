import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'
import { InlineError } from './inline-error'

describe('InlineError', () => {
  it('announces its message and exposes an optional recovery action', () => {
    render(
      <InlineError
        title="Card was not saved"
        message="Check your connection and try again."
        action={<Button variant="secondary">Retry</Button>}
      />,
    )

    const error = screen.getByRole('alert')

    expect(error).toHaveTextContent(
      'Card was not savedCheck your connection and try again.',
    )
    expect(error).toHaveAttribute('aria-live', 'assertive')
    expect(error).toHaveAttribute('aria-atomic', 'true')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled()
  })

  it('allows non-urgent async errors to use a polite live region', () => {
    render(
      <InlineError role="status" message="The server is temporarily unavailable." />,
    )

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })
})
