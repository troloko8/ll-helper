import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { UseFormSetError } from 'react-hook-form'
import { DECK_LANGUAGE_OPTIONS, type DeckResponseDto } from '@/entities/deck'
import { getApiFieldErrors } from '@/shared/api'
import {
    ApiErrorPresentation,
    Button,
    FormField,
    Input,
    Select,
    Textarea,
} from '@/shared/ui'
import { useCreateDeckMutation } from '../api/create-deck-api'
import {
    createDeckFormSchema,
    type CreateDeckFormValues,
} from '../model/create-deck-form-schema'
import styles from './create-deck-form.module.css'

const DECK_FIELDS = [
    'title',
    'description',
    'sourceLanguage',
    'targetLanguage',
] as const

export interface CreateDeckFormProps {
    onSuccess?: (response: DeckResponseDto) => void | Promise<void>
    onCancel?: () => void
}

function applyFieldErrors(
    error: unknown,
    setError: UseFormSetError<CreateDeckFormValues>,
): boolean {
    const fieldErrors = getApiFieldErrors(error)
    let applied = false

    for (const field of DECK_FIELDS) {
        const message = fieldErrors[field]
        if (message) {
            setError(field, { type: 'server', message })
            applied = true
        }
    }

    return applied
}

export function CreateDeckForm({ onSuccess, onCancel }: CreateDeckFormProps) {
    const [submitError, setSubmitError] = useState<unknown>()
    const [createDeck, { isLoading }] = useCreateDeckMutation()
    const {
        register,
        handleSubmit,
        clearErrors,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CreateDeckFormValues>({
        resolver: zodResolver(createDeckFormSchema),
        defaultValues: {
            title: '',
            description: '',
            sourceLanguage: 'EN',
            targetLanguage: 'RU',
            isPrivate: false,
        },
        mode: 'onTouched',
    })
    const isBusy = isLoading || isSubmitting

    const onSubmit = handleSubmit(async (values) => {
        clearErrors()
        setSubmitError(undefined)

        try {
            const response = await createDeck({
                title: values.title,
                description: values.description,
                sourceLanguage: values.sourceLanguage,
                targetLanguage: values.targetLanguage,
                isPublic: !values.isPrivate,
            }).unwrap()
            await onSuccess?.(response)
        } catch (error) {
            if (!applyFieldErrors(error, setError)) {
                setSubmitError(error)
            }
        }
    })

    return (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
            <fieldset className={styles.fields} disabled={isBusy}>
                <FormField
                    label="Deck title"
                    error={errors.title?.message}
                    required
                >
                    <Input
                        {...register('title')}
                        autoComplete="off"
                        placeholder="e.g., JLPT N3 Verbs"
                    />
                </FormField>

                <FormField
                    label="Description"
                    description="Optional context or focus areas."
                    error={errors.description?.message}
                >
                    <Textarea
                        {...register('description')}
                        maxLength={500}
                        placeholder="What will you learn in this deck?"
                    />
                </FormField>

                <div className={styles.languageFields}>
                    <FormField
                        label="Source language"
                        error={errors.sourceLanguage?.message}
                        required
                    >
                        <Select {...register('sourceLanguage')}>
                            {DECK_LANGUAGE_OPTIONS.map((language) => (
                                <option
                                    key={language.value}
                                    value={language.value}
                                >
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
                            {DECK_LANGUAGE_OPTIONS.map((language) => (
                                <option
                                    key={language.value}
                                    value={language.value}
                                >
                                    {language.label}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                </div>

                <label className={styles.privacyControl}>
                    <input
                        {...register('isPrivate')}
                        className={styles.privacyInput}
                        type="checkbox"
                    />
                    <span className={styles.switch} aria-hidden="true">
                        <span />
                    </span>
                    <span className={styles.privacyCopy}>
                        <span>Private Deck</span>
                        <small>
                            Only you can view this deck. It will not appear in
                            Discover.
                        </small>
                    </span>
                </label>

                {submitError !== undefined && (
                    <ApiErrorPresentation
                        error={submitError}
                        mode="inline"
                        title="Unable to create deck"
                    />
                )}

                <div className={styles.actions}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        className={styles.submit}
                        type="submit"
                        isLoading={isBusy}
                        loadingLabel="Creating deck"
                    >
                        Create Deck
                    </Button>
                </div>
            </fieldset>
        </form>
    )
}
