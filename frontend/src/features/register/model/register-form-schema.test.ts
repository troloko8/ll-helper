import { describe, expect, it } from 'vitest'
import { registerFormSchema } from './register-form-schema'

describe('registerFormSchema', () => {
    it.each(['123456', 'a'.repeat(100)])(
        'accepts a password at a backend size boundary',
        (password) => {
            expect(
                registerFormSchema.safeParse({
                    email: 'learner@example.com',
                    password,
                }).success,
            ).toBe(true)
        },
    )

    it.each([
        { email: 'not-an-email', password: 'password', field: 'invalid email' },
        {
            email: 'user@example.com',
            password: '12345',
            field: 'short password',
        },
        {
            email: 'user@example.com',
            password: 'a'.repeat(101),
            field: 'password longer than 100 characters',
        },
        {
            email: 'user@example.com',
            password: '      ',
            field: 'blank password',
        },
    ])('rejects $field', ({ email, password }) => {
        expect(registerFormSchema.safeParse({ email, password }).success).toBe(
            false,
        )
    })
})
