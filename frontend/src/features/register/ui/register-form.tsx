import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { UseFormSetError } from 'react-hook-form'
import type { AuthResponseDto } from '@/entities/session'
import { getApiFieldErrors, isApiError } from '@/shared/api'
import { ApiErrorPresentation, Button, FormField, Input } from '@/shared/ui'
import { useRegisterMutation } from '../api/register-api'
import { registerFormSchema } from '../model/register-form-schema'
import type { RegisterFormValues } from '../model/register-form-schema'
import styles from './register-form.module.css'

export interface RegisterFormProps {
    onSuccess?: (response: AuthResponseDto) => void | Promise<void>
}

function applyFieldErrors(
    error: unknown,
    setError: UseFormSetError<RegisterFormValues>,
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

    if (error.status === 409) {
        return {
            title: 'Account already exists',
            message: 'An account with this email already exists.',
        }
    }

    if (error.status === 429) {
        return {
            title: 'Too many registration attempts',
            message: 'Wait a minute before trying again.',
        }
    }

    return {}
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
    const [submitError, setSubmitError] = useState<unknown>()
    const [createAccount, { isLoading }] = useRegisterMutation()
    const {
        register,
        handleSubmit,
        clearErrors,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerFormSchema),
        defaultValues: { email: '', password: '' },
        mode: 'onTouched',
    })
    const isBusy = isLoading || isSubmitting

    const onSubmit = handleSubmit(async (values) => {
        clearErrors()
        setSubmitError(undefined)

        try {
            const response = await createAccount(values).unwrap()
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
                    description="Use 6–100 characters."
                    error={errors.password?.message}
                    required
                >
                    <Input
                        {...register('password')}
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a password"
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
                    loadingLabel="Creating account"
                >
                    Create Account
                </Button>
            </fieldset>
        </form>
    )
}
