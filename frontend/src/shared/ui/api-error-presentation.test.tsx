import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'
import { ApiErrorPresentation } from './api-error-presentation'

describe('ApiErrorPresentation', () => {
  it('renders page-level errors through PageState', () => {
    render(
      <ApiErrorPresentation
        error={{ status: 404, message: 'Deck does not exist' }}
        mode="page"
        action={<Button>Back to learning</Button>}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Not foundThe requested resource could not be found.',
    )
    expect(
      screen.getByRole('button', { name: 'Back to learning' }),
    ).toBeEnabled()
  })

  it('renders feature-level errors through InlineError', () => {
    render(
      <ApiErrorPresentation
        error={{ status: 429, message: 'Rate limit exceeded' }}
        mode="inline"
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Too many requestsWait a moment before trying again.',
    )
  })

  it('allows a feature to provide contextual copy', () => {
    render(
      <ApiErrorPresentation
        error={{ status: 409, message: 'Deck already enrolled' }}
        mode="inline"
        title="Already enrolled"
        message="This deck is already in your learning list."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Already enrolledThis deck is already in your learning list.',
    )
  })
})
