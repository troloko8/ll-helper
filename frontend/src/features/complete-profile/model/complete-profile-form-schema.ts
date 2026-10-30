import { z } from 'zod'
import {
    normalizeUsername,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
    USERNAME_PATTERN,
} from '@/entities/user'

const LANGUAGE_CODE_PATTERN = /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/

const requiredString = (message: string) =>
    z.string().refine((value) => value.trim().length > 0, message)

const sizedRequiredString = (label: string, minimum: number, maximum: number) =>
    requiredString(`${label} is required`).pipe(
        z
            .string()
            .min(minimum, `${label} must be at least ${minimum} characters`)
            .max(maximum, `${label} must be at most ${maximum} characters`),
    )

const languageCodeSchema = (label: string) =>
    sizedRequiredString(label, 2, 10).pipe(
        z.string().regex(LANGUAGE_CODE_PATTERN, `Select a valid ${label}`),
    )

const usernameSlugSchema = z
    .string()
    .refine((username) => username.trim().length > 0, 'Username is required')
    .transform(normalizeUsername)
    .pipe(
        z
            .string()
            .min(
                USERNAME_MIN_LENGTH,
                `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
            )
            .max(
                USERNAME_MAX_LENGTH,
                `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
            )
            .regex(
                USERNAME_PATTERN,
                'Use lowercase letters, numbers, underscores, or hyphens; start and end with a letter or number',
            ),
    )

export const completeProfileFormSchema = z.object({
    firstName: sizedRequiredString('First name', 2, 100),
    lastName: sizedRequiredString('Last name', 2, 100),
    username: usernameSlugSchema,
    nativeLanguage: languageCodeSchema('native language'),
    targetLanguage: languageCodeSchema('target language'),
    uiLanguage: languageCodeSchema('interface language'),
})

export type CompleteProfileFormValues = z.infer<
    typeof completeProfileFormSchema
>
