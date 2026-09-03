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

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Card was not savedCheck your connection and try again.',
    )
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled()
  })
})
