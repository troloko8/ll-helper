import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { UseFormSetError } from 'react-hook-form'
import type { AuthResponseDto } from '@/entities/session'
import { getApiFieldErrors, isApiError } from '@/shared/api'
import { ApiErrorPresentation, Button, FormField, Input } from '@/shared/ui'
import { useLoginMutation } from '../api/login-api'
import { loginFormSchema } from '../model/login-form-schema'
import type { LoginFormValues } from '../model/login-form-schema'
import styles from './login-form.module.css'

export interface LoginFormProps {
    onSuccess?: (response: AuthResponseDto) => void | Promise<void>
}

function applyFieldErrors(
    error: unknown,
    setError: UseFormSetError<LoginFormValues>,
): boolean {
    const fieldErrors = getApiFieldErrors(error)
    let applied = false

    for (const field of ['email', 'password'] as const) {
        const message = fieldErrors[field]
        if (message) {
            setError(field, { type: 'server', message })
            applied = true
        }
    }

    return applied
}

function getSubmitErrorCopy(error: unknown) {
    if (!isApiError(error)) {
        return {}
    }

    if (error.status === 401) {
        return {
            title: 'Sign in failed',
            message: 'Invalid email or password.',
        }
    }

    if (error.status === 429) {
        return {
            title: 'Too many sign-in attempts',
            message: 'Wait a minute before trying again.',
        }
    }

    return {}
}

export function LoginForm({ onSuccess }: LoginFormProps) {
    const [submitError, setSubmitError] = useState<unknown>()
    const [login, { isLoading }] = useLoginMutation()
    const {
        register,
        handleSubmit,
        clearErrors,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: { email: '', password: '' },
        mode: 'onTouched',
    })
    const isBusy = isLoading || isSubmitting

    const onSubmit = handleSubmit(async (values) => {
        clearErrors()
        setSubmitError(undefined)

        try {
            const response = await login(values).unwrap()
            await onSuccess?.(response)
        } catch (error) {
            if (!applyFieldErrors(error, setError)) {
                setSubmitError(error)
            }
        }
    })

    const submitErrorCopy = getSubmitErrorCopy(submitError)

    return (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
            <fieldset className={styles.fields} disabled={isBusy}>
                <FormField label="Email" error={errors.email?.message} required>
                    <Input
                        {...register('email')}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder="you@example.com"
                    />
                </FormField>

                <FormField
                    label="Password"
                    error={errors.password?.message}
                    required
                >
                    <Input
                        {...register('password')}
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                    />
                </FormField>

                {submitError !== undefined && (
                    <ApiErrorPresentation
                        error={submitError}
                        mode="inline"
                        title={submitErrorCopy.title}
                        message={submitErrorCopy.message}
                    />
                )}

                <Button
                    className={styles.submit}
                    type="submit"
                    isLoading={isBusy}
                    loadingLabel="Signing in"
                >
                    Sign In
                </Button>
            </fieldset>
        </form>
    )
}
