import { describe, expect, it } from 'vitest'
import { loginFormSchema } from './login-form-schema'

describe('loginFormSchema', () => {
    it('accepts credentials that satisfy the backend contract', () => {
        expect(
            loginFormSchema.safeParse({
                email: 'learner@example.com',
                password: 'x',
            }).success,
        ).toBe(true)
    })

    it.each([
        { email: '', password: 'password', field: 'blank email' },
        { email: 'not-an-email', password: 'password', field: 'invalid email' },
        {
            email: `${'a'.repeat(250)}@x.com`,
            password: 'password',
            field: 'email longer than 255 characters',
        },
        { email: 'user@example.com', password: '   ', field: 'blank password' },
    ])('rejects $field', ({ email, password }) => {
        expect(loginFormSchema.safeParse({ email, password }).success).toBe(
            false,
        )
    })
})
