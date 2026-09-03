import { z } from 'zod'

const requiredString = (message: string) =>
    z.string().refine((value) => value.trim().length > 0, message)

export const registerFormSchema = z.object({
    email: requiredString('Email is required').pipe(
        z
            .string()
            .max(255, 'Email must be at most 255 characters')
            .email('Enter a valid email address'),
    ),
    password: requiredString('Password is required').pipe(
        z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .max(100, 'Password must be at most 100 characters'),
    ),
})

export type RegisterFormValues = z.infer<typeof registerFormSchema>
