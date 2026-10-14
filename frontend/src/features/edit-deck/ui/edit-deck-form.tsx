import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type UseFormSetError } from 'react-hook-form'
import {
    DECK_LANGUAGE_OPTIONS,
    deckFormSchema,
    deckFormValuesToRequest,
    type DeckFormValues,
    type DeckResponseDto,
} from '@/entities/deck'
import { getApiFieldErrors } from '@/shared/api'
import {
    ApiErrorPresentation,
    Button,
    ConfirmationDialog,
    FormField,
    Input,
    Select,
    Textarea,
} from '@/shared/ui'
import {
    useDeleteDeckMutation,
    useUpdateDeckMutation,
} from '../api/edit-deck-api'
import styles from './edit-deck-form.module.css'

const DECK_FIELDS = [
    'title',
    'description',
    'sourceLanguage',
    'targetLanguage',
] as const
function applyFieldErrors(
    error: unknown,
    setError: UseFormSetError<DeckFormValues>,
) {
    const errors = getApiFieldErrors(error)
    let applied = false
    for (const field of DECK_FIELDS) {
        if (errors[field]) {
            setError(field, { type: 'server', message: errors[field] })
            applied = true
        }
    }
    return applied
}

interface EditDeckFormProps {
    deck: DeckResponseDto
    values: DeckFormValues
    onCancel: () => void
    onSaved: () => void
    onDeleted: () => void
}

export function EditDeckForm({
    deck,
    values,
    onCancel,
    onSaved,
    onDeleted,
}: EditDeckFormProps) {
    const [submitError, setSubmitError] = useState<unknown>()
    const [deleteError, setDeleteError] = useState<unknown>()
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [updateDeck, updateState] = useUpdateDeckMutation()
    const [deleteDeck, deleteState] = useDeleteDeckMutation()
    const {
        register,
        handleSubmit,
        clearErrors,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<DeckFormValues>({
        resolver: zodResolver(deckFormSchema),
        defaultValues: values,
        mode: 'onTouched',
    })
    const isBusy = updateState.isLoading || isSubmitting
    const onSubmit = handleSubmit(async (formValues) => {
        clearErrors()
        setSubmitError(undefined)
        try {
            await updateDeck({
                deckId: deck.id,
                body: deckFormValuesToRequest(formValues),
            }).unwrap()
            onSaved()
        } catch (error) {
            if (!applyFieldErrors(error, setError)) setSubmitError(error)
        }
    })
    const handleDelete = async () => {
        setDeleteError(undefined)
        try {
            await deleteDeck(deck.id).unwrap()
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
                        label="Deck title"
                        error={errors.title?.message}
                        required
                    >
                        <Input {...register('title')} maxLength={100} />
                    </FormField>
                    <FormField
                        label="Description"
                        error={errors.description?.message}
                    >
                        <Textarea
                            {...register('description')}
                            maxLength={500}
                        />
                    </FormField>
                    <div className={styles.columns}>
                        <FormField
                            label="Source language"
                            error={errors.sourceLanguage?.message}
                            required
                        >
                            <Select {...register('sourceLanguage')}>
                                {DECK_LANGUAGE_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
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
                                {DECK_LANGUAGE_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
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
                                Only you can view this deck. It will not appear
                                in Discover.
                            </small>
                        </span>
                    </label>
                    {submitError !== undefined && (
                        <ApiErrorPresentation
                            error={submitError}
                            mode="inline"
                            title="Unable to update deck"
                        />
                    )}
                    <div className={styles.actions}>
                        <Button
                            type="button"
                            variant="danger"
                            onClick={() => setConfirmingDelete(true)}
                        >
                            Delete deck
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
                                loadingLabel="Saving deck"
                            >
                                Save changes
                            </Button>
                        </div>
                    </div>
                </fieldset>
            </form>
            <ConfirmationDialog
                open={confirmingDelete}
                title="Delete this deck?"
                description="This permanently deletes the deck, all of its cards, every enrollment, and all learner progress connected to it. This action cannot be undone."
                confirmLabel="Delete deck"
                busyLabel="Deleting deck"
                isBusy={deleteState.isLoading}
                error={
                    deleteError !== undefined ? (
                        <ApiErrorPresentation
                            error={deleteError}
                            mode="inline"
                            title="Unable to delete deck"
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
