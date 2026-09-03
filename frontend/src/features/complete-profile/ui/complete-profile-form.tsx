import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { UseFormSetError } from 'react-hook-form'
import type { UserResponseDto } from '@/entities/user'
import { getApiFieldErrors, isApiError } from '@/shared/api'
import {
    ApiErrorPresentation,
    Button,
    FormField,
    Input,
    Select,
} from '@/shared/ui'
import { useCreateUserMutation } from '../api/complete-profile-api'
import { completeProfileFormSchema } from '../model/complete-profile-form-schema'
import type { CompleteProfileFormValues } from '../model/complete-profile-form-schema'
import styles from './complete-profile-form.module.css'

const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Mandarin Chinese' },
    { value: 'ru', label: 'Russian' },
] as const

const PROFILE_FIELDS = [
    'username',
    'firstName',
    'lastName',
    'nativeLanguage',
    'targetLanguage',
    'uiLanguage',
] as const

export interface CompleteProfileFormProps {
    onSuccess?: (response: UserResponseDto) => void | Promise<void>
}

function applyFieldErrors(
    error: unknown,
    setError: UseFormSetError<CompleteProfileFormValues>,
): boolean {
    const fieldErrors = getApiFieldErrors(error)
    let applied = false

    for (const field of PROFILE_FIELDS) {
        const message = fieldErrors[field]
        if (message) {
            setError(field, { type: 'server', message })
            applied = true
        }
    }

    if (
        isApiError(error) &&
        error.status === 409 &&
        error.message.toLowerCase().includes('username')
    ) {
        setError('username', {
            type: 'server',
            message: 'This username is already taken.',
        })
        return true
    }

    return applied
}

function getSubmitErrorCopy(error: unknown) {
    if (!isApiError(error)) {
        return {}
    }

    if (error.status === 404) {
        return {
            title: 'Account unavailable',
            message: 'We could not find the account for this session.',
        }
    }

    if (error.status === 409) {
        return {
            title: 'Profile already exists',
            message: 'A profile has already been created for this account.',
        }
    }

    return {}
}

export function CompleteProfileForm({ onSuccess }: CompleteProfileFormProps) {
    const [submitError, setSubmitError] = useState<unknown>()
    const [createUser, { isLoading }] = useCreateUserMutation()
    const {
        register,
        handleSubmit,
        clearErrors,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CompleteProfileFormValues>({
        resolver: zodResolver(completeProfileFormSchema),
        defaultValues: {
            username: '',
            firstName: '',
            lastName: '',
            nativeLanguage: '',
            targetLanguage: '',
            uiLanguage: 'en',
        },
        mode: 'onTouched',
    })
    const isBusy = isLoading || isSubmitting

    const onSubmit = handleSubmit(async (values) => {
        clearErrors()
        setSubmitError(undefined)

        try {
            const response = await createUser({
                ...values,
                avatarUrl: null,
            }).unwrap()
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
                <FormField
                    label="Username"
                    error={errors.username?.message}
                    required
                >
                    <Input
                        {...register('username')}
                        className={styles.username}
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder="neon_reader"
                    />
                </FormField>

                <div className={styles.nameFields}>
                    <FormField
                        label="First name"
                        error={errors.firstName?.message}
                        required
                    >
                        <Input
                            {...register('firstName')}
                            autoComplete="given-name"
                            placeholder="Jane"
                        />
                    </FormField>

                    <FormField
                        label="Last name"
                        error={errors.lastName?.message}
                        required
                    >
                        <Input
                            {...register('lastName')}
                            autoComplete="family-name"
                            placeholder="Doe"
                        />
                    </FormField>
                </div>

                <FormField
                    label="Native language"
                    error={errors.nativeLanguage?.message}
                    required
                >
                    <Select {...register('nativeLanguage')}>
                        <option value="">Select language</option>
                        {LANGUAGE_OPTIONS.map((language) => (
                            <option key={language.value} value={language.value}>
                                {language.label}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField
                    label="Target language"
                    error={errors.targetLanguage?.message}
                    required
                >
                    <Select {...register('targetLanguage')}>
                        <option value="">Select language</option>
                        {LANGUAGE_OPTIONS.map((language) => (
                            <option key={language.value} value={language.value}>
                                {language.label}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField
                    label="Interface language"
                    error={errors.uiLanguage?.message}
                    required
                >
                    <Select {...register('uiLanguage')}>
                        {LANGUAGE_OPTIONS.map((language) => (
                            <option key={language.value} value={language.value}>
                                {language.label}
                            </option>
                        ))}
                    </Select>
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
                    loadingLabel="Initializing profile"
                >
                    Initialize Profile
                </Button>
            </fieldset>
        </form>
    )
}
