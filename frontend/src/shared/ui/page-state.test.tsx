import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'
import { PageState } from './page-state'

describe('PageState', () => {
  it('announces a blocking loading state', () => {
    render(
      <PageState
        variant="loading"
        title="Loading your profile"
        description="This will only take a moment."
      />,
    )

    const state = screen.getByRole('status')

    expect(state).toHaveAttribute('aria-busy', 'true')
    expect(state).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('heading', { name: 'Loading your profile' })).toBeInTheDocument()
  })

  it('presents a page error and its recovery action', () => {
    render(
      <PageState
        variant="error"
        title="Unable to load learning decks"
        description="Something went wrong. Try again."
        action={<Button>Try Again</Button>}
      />,
    )

    const state = screen.getByRole('alert')

    expect(state).toHaveAttribute('aria-live', 'assertive')
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeEnabled()
  })
})
