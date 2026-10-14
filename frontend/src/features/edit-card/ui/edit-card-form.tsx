import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import type { FieldPath, UseFormSetError } from 'react-hook-form'
import {
    CARD_LIMITS,
    cardFormSchema,
    cardFormValuesToRequest,
    type CardFormValues,
    type CardResponseDto,
} from '@/entities/card'
import { getApiFieldErrors } from '@/shared/api'
import {
    ApiErrorPresentation,
    Button,
    ConfirmationDialog,
    FormField,
    InlineError,
    Input,
    Textarea,
} from '@/shared/ui'
import {
    useDeleteCardMutation,
    useUpdateCardMutation,
} from '../api/edit-card-api'
import styles from './edit-card-form.module.css'

const CARD_FIELDS = ['title', 'definition', 'translation', 'synonyms'] as const

function applyFieldErrors(
    error: unknown,
    setError: UseFormSetError<CardFormValues>,
): boolean {
    const fieldErrors = getApiFieldErrors(error)
    let applied = false
    for (const field of CARD_FIELDS) {
        if (fieldErrors[field]) {
            setError(field as FieldPath<CardFormValues>, {
                type: 'server',
                message: fieldErrors[field],
            })
            applied = true
        }
    }
    const examplesError = Object.entries(fieldErrors).find(
        ([field]) => field === 'examples' || field.startsWith('examples['),
    )?.[1]
    if (examplesError) {
        setError('examples', { type: 'server', message: examplesError })
        applied = true
    }
    return applied
}

interface EditCardFormProps {
    card: CardResponseDto
    values: CardFormValues
    onCancel: () => void
    onSaved: (card: CardResponseDto) => void
    onDeleted: () => void
}

export function EditCardForm({
    card,
    values,
    onCancel,
    onSaved,
    onDeleted,
}: EditCardFormProps) {
    const [submitError, setSubmitError] = useState<unknown>()
    const [deleteError, setDeleteError] = useState<unknown>()
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [updateCard, updateState] = useUpdateCardMutation()
    const [deleteCard, deleteState] = useDeleteCardMutation()
    const {
        control,
        register,
        handleSubmit,
        clearErrors,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CardFormValues>({
        resolver: zodResolver(cardFormSchema),
        defaultValues: values,
        mode: 'onTouched',
    })
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'examples',
    })
    const isBusy = updateState.isLoading || isSubmitting

    const onSubmit = handleSubmit(async (formValues) => {
        clearErrors()
        setSubmitError(undefined)
        try {
            const response = await updateCard({
                cardId: card.id,
                deckId: card.deckId,
                body: cardFormValuesToRequest(formValues),
            }).unwrap()
            onSaved(response)
        } catch (error) {
            if (!applyFieldErrors(error, setError)) {
                setSubmitError(error)
            }
        }
    })

    const handleDelete = async () => {
        setDeleteError(undefined)
        try {
            await deleteCard({ cardId: card.id, deckId: card.deckId }).unwrap()
            onDeleted()
        } catch (error) {
            setDeleteError(error)
        }
    }

    return (
        <>
            <form className={styles.form} onSubmit={onSubmit} noValidate>
                <fieldset disabled={isBusy}>
                    <FormField
                        label="Target word"
                        error={errors.title?.message}
                        required
                    >
                        <Input
                            {...register('title')}
                            maxLength={CARD_LIMITS.TITLE_MAX_LENGTH}
                        />
                    </FormField>
                    <div className={styles.columns}>
                        <FormField
                            label="Definition"
                            error={errors.definition?.message}
                        >
                            <Textarea
                                {...register('definition')}
                                maxLength={CARD_LIMITS.DEFINITION_MAX_LENGTH}
                            />
                        </FormField>
                        <FormField
                            label="Translation"
                            error={errors.translation?.message}
                            required
                        >
                            <Textarea
                                {...register('translation')}
                                maxLength={CARD_LIMITS.TRANSLATION_MAX_LENGTH}
                            />
                        </FormField>
                    </div>
                    <FormField
                        label="Synonyms"
                        description="Separate multiple values with commas."
                        error={errors.synonyms?.message}
                    >
                        <Input {...register('synonyms')} />
                    </FormField>
                    <section
                        className={styles.examples}
                        aria-labelledby="edit-examples-title"
                    >
                        <div className={styles.sectionHeading}>
                            <h2 id="edit-examples-title">Usage examples</h2>
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={
                                    fields.length >=
                                    CARD_LIMITS.EXAMPLES_MAX_COUNT
                                }
                                onClick={() => append({ value: '' })}
                            >
                                Add another
                            </Button>
                        </div>
                        {errors.examples?.message && (
                            <InlineError message={errors.examples.message} />
                        )}
                        {fields.map((field, index) => (
                            <div className={styles.exampleRow} key={field.id}>
                                <FormField
                                    label={`Example ${index + 1}`}
                                    error={
                                        errors.examples?.[index]?.value?.message
                                    }
                                >
                                    <Textarea
                                        {...register(`examples.${index}.value`)}
                                        maxLength={
                                            CARD_LIMITS.EXAMPLE_MAX_LENGTH
                                        }
                                        rows={2}
                                    />
                                </FormField>
                                {fields.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        aria-label={`Remove example ${index + 1}`}
                                        onClick={() => remove(index)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        ))}
                    </section>
                    {submitError !== undefined && (
                        <ApiErrorPresentation
                            error={submitError}
                            mode="inline"
                            title="Unable to update card"
                        />
                    )}
                    <div className={styles.actions}>
                        <Button
                            type="button"
                            variant="danger"
                            onClick={() => setConfirmingDelete(true)}
                        >
                            Delete card
                        </Button>
                        <div>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                isLoading={isBusy}
                                loadingLabel="Saving card"
                            >
                                Save changes
                            </Button>
                        </div>
                    </div>
                </fieldset>
            </form>
            <ConfirmationDialog
                open={confirmingDelete}
                title="Delete this card?"
                description="This permanently deletes the card and every learner's progress for it. This action cannot be undone."
                confirmLabel="Delete card"
                busyLabel="Deleting card"
                isBusy={deleteState.isLoading}
                error={
                    deleteError !== undefined ? (
                        <ApiErrorPresentation
                            error={deleteError}
                            mode="inline"
                            title="Unable to delete card"
                        />
                    ) : undefined
                }
                onCancel={() => {
                    setConfirmingDelete(false)
                    setDeleteError(undefined)
                }}
                onConfirm={() => void handleDelete()}
            />
        </>
    )
}
