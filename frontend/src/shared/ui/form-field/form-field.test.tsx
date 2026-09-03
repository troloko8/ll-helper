import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField } from './form-field'
import { Input } from '../form-control'

describe('FormField', () => {
    it('associates its label, description, and error with the control', () => {
        render(
            <FormField
                label="Email"
                description="Use your account email"
                error="Email is required"
                required
            >
                <Input type="email" required={false} />
            </FormField>,
        )

        const input = screen.getByRole('textbox', { name: 'Email' })
        const description = screen.getByText('Use your account email')
        const error = screen.getByText('Email is required')

        expect(input).toBeRequired()
        expect(input).toHaveAttribute('aria-invalid', 'true')
        expect(error).toHaveAttribute('aria-live', 'polite')
        expect(error).toHaveAttribute('aria-atomic', 'true')
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

    it('updates the control semantics when a field error appears asynchronously', () => {
        const { rerender } = render(
            <FormField label="Username">
                <Input />
            </FormField>,
        )

        const input = screen.getByRole('textbox', { name: 'Username' })
        const errorRegion = document.getElementById(`${input.id}-error`)

        expect(input).not.toHaveAttribute('aria-invalid')
        expect(input).not.toHaveAttribute('aria-describedby')
        expect(errorRegion).toBeEmptyDOMElement()

        rerender(
            <FormField label="Username" error="Username is already taken">
                <Input />
            </FormField>,
        )

        expect(input).toHaveAttribute('aria-invalid', 'true')
        expect(input).toHaveAttribute('aria-describedby', errorRegion?.id)
        expect(errorRegion).toHaveTextContent('Username is already taken')
        expect(errorRegion).toHaveAttribute('aria-live', 'polite')
    })

    it('propagates a disabled form state to the control', () => {
        render(
            <FormField label="Email" disabled>
                <Input disabled={false} />
            </FormField>,
        )

        expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled()
    })
})
