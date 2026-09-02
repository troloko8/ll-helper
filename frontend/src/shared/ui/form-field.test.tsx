import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField } from './form-field'
import { Input } from './input'

describe('FormField', () => {
  it('associates its label, description, and error with the control', () => {
    render(
      <FormField
        label="Email"
        description="Use your account email"
        error="Email is required"
        required
      >
        <Input type="email" />
      </FormField>,
    )

    const input = screen.getByRole('textbox', { name: 'Email' })
    const description = screen.getByText('Use your account email')
    const error = screen.getByRole('alert')

    expect(input).toBeRequired()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute(
      'aria-describedby',
      `${description.getAttribute('id')} ${error.getAttribute('id')}`,
    )
  })

  it('preserves accessibility attributes supplied by the control', () => {
    render(
      <FormField label="Username" description="Public name">
        <Input
          id="username"
          aria-describedby="external-help"
          aria-invalid="grammar"
        />
      </FormField>,
    )

    const input = screen.getByRole('textbox', { name: 'Username' })

    expect(input).toHaveAttribute('id', 'username')
    expect(input).toHaveAttribute('aria-invalid', 'grammar')
    expect(input).toHaveAttribute(
      'aria-describedby',
      'external-help username-description',
    )
  })
})
