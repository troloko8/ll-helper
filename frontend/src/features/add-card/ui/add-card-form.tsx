import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import type { FieldPath, UseFormSetError } from 'react-hook-form'
import type { CardResponseDto } from '@/entities/card'
import { getApiFieldErrors } from '@/shared/api'
import {
    ApiErrorPresentation,
    Button,
    FormField,
    Input,
    Textarea,
} from '@/shared/ui'
import { useAddCardMutation } from '../api/add-card-api'
import {
    addCardFormSchema,
    parseExamples,
    parseSynonyms,
    type AddCardFormValues,
} from '../model/add-card-form-schema'
import styles from './add-card-form.module.css'

const CARD_FIELDS = ['title', 'definition', 'translation', 'synonyms'] as const

export interface AddCardFormProps {
    deckId: number
    onSuccess?: (response: CardResponseDto) => void | Promise<void>
    onCancel?: () => void
}

function applyFieldErrors(
    error: unknown,
    setError: UseFormSetError<AddCardFormValues>,
): boolean {
    const fieldErrors = getApiFieldErrors(error)
    let applied = false

    for (const field of CARD_FIELDS) {
        const message = fieldErrors[field]
        if (message) {
            setError(field as FieldPath<AddCardFormValues>, {
                type: 'server',
                message,
            })
            applied = true
        }
    }

    return applied
}

export function AddCardForm({ deckId, onSuccess, onCancel }: AddCardFormProps) {
    const [submitError, setSubmitError] = useState<unknown>()
    const [addCard, { isLoading }] = useAddCardMutation()
    const {
        control,
        register,
        handleSubmit,
        clearErrors,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<AddCardFormValues>({
        resolver: zodResolver(addCardFormSchema),
        defaultValues: {
            title: '',
            definition: '',
            translation: '',
            synonyms: '',
            examples: [{ value: '' }],
        },
        mode: 'onTouched',
    })
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'examples',
    })
    const isBusy = isLoading || isSubmitting

    const onSubmit = handleSubmit(async (values) => {
        clearErrors()
        setSubmitError(undefined)

        try {
            const response = await addCard({
                title: values.title,
                definition: values.definition || null,
                translation: values.translation || null,
                synonyms: parseSynonyms(values.synonyms),
                examples: parseExamples(values.examples),
                deckId,
                autoGenerate: false,
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
                    label="Target word"
                    error={errors.title?.message}
                    required
                    className={styles.wordField}
                >
                    <Input
                        {...register('title')}
                        autoComplete="off"
                        maxLength={100}
                        placeholder="e.g., Ephemeral"
                    />
                </FormField>

                <div className={styles.meanings}>
                    <FormField
                        label="Definition"
                        description="Meaning in the target language."
                        error={errors.definition?.message}
                    >
                        <Textarea
                            {...register('definition')}
                            maxLength={1000}
                            placeholder="Meaning in target language..."
                        />
                    </FormField>

                    <FormField
                        label="Translation"
                        description="Meaning in your native language."
                        error={errors.translation?.message}
                    >
                        <Textarea
                            {...register('translation')}
                            maxLength={200}
                            placeholder="Meaning in native language..."
                        />
                    </FormField>
                </div>

                <div className={styles.synonymsPanel}>
                    <FormField
                        label="Synonyms"
                        description="Separate multiple values with commas."
                        error={errors.synonyms?.message}
                    >
                        <Input
                            {...register('synonyms')}
                            autoComplete="off"
                            placeholder="fleeting, transient"
                        />
                    </FormField>
                </div>

                <section
                    className={styles.examples}
                    aria-labelledby="examples-title"
                >
                    <div className={styles.examplesHeading}>
                        <div>
                            <h2 id="examples-title">Usage examples</h2>
                            <p>
                                Optional sentences that show the word in
                                context.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={fields.length >= 20}
                            onClick={() => append({ value: '' })}
                        >
                            Add another
                        </Button>
                    </div>

                    <div className={styles.exampleList}>
                        {fields.map((field, index) => (
                            <div className={styles.exampleRow} key={field.id}>
                                <span
                                    className={styles.exampleNumber}
                                    aria-hidden="true"
                                >
                                    {index + 1}
                                </span>
                                <FormField
                                    label={`Example ${index + 1}`}
                                    error={
                                        errors.examples?.[index]?.value?.message
                                    }
                                    className={styles.exampleField}
                                >
                                    <Textarea
                                        {...register(`examples.${index}.value`)}
                                        maxLength={500}
                                        rows={2}
                                        placeholder="Sentence demonstrating usage..."
                                    />
                                </FormField>
                                {fields.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className={styles.removeExample}
                                        aria-label={`Remove example ${index + 1}`}
                                        onClick={() => remove(index)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {submitError !== undefined && (
                    <ApiErrorPresentation
                        error={submitError}
                        mode="inline"
                        title="Unable to save card"
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
                        loadingLabel="Saving card"
                    >
                        Save card
                    </Button>
                </div>
            </fieldset>
        </form>
    )
}
