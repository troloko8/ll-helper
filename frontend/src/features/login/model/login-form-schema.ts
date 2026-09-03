import { z } from 'zod'

const requiredString = (message: string) =>
    z.string().refine((value) => value.trim().length > 0, message)

export const loginFormSchema = z.object({
    email: requiredString('Email is required').pipe(
        z
            .string()
            .max(255, 'Email must be at most 255 characters')
            .email('Enter a valid email address'),
    ),
    password: requiredString('Password is required'),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
