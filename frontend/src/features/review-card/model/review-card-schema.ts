import { z } from 'zod'

export const reviewCardSchema = z.object({
    userAnswer: z
        .string()
        .trim()
        .min(1, 'Enter an answer before checking it')
        .max(100, 'Answer must be at most 100 characters'),
})

export type ReviewCardFormValues = z.infer<typeof reviewCardSchema>
