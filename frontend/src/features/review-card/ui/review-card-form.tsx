import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { CardReviewResponseDto } from '@/entities/learning'
import { getApiFieldErrors } from '@/shared/api'
import { ApiErrorPresentation, Button, FormField, Input } from '@/shared/ui'
import { useReviewCardMutation } from '../api/review-card-api'
import {
    reviewCardSchema,
    type ReviewCardFormValues,
} from '../model/review-card-schema'
import styles from './review-card-form.module.css'

export interface ReviewCardResult {
    response: CardReviewResponseDto
    userAnswer: string
}

export interface ReviewCardFormProps {
    cardId: number
    deckId: number
    onReviewed: (result: ReviewCardResult) => void
}

export function ReviewCardForm({
    cardId,
    deckId,
    onReviewed,
}: ReviewCardFormProps) {
    const [submitError, setSubmitError] = useState<unknown>()
    const [reviewCard, { isLoading }] = useReviewCardMutation()
    const {
        register,
        handleSubmit,
        clearErrors,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ReviewCardFormValues>({
        resolver: zodResolver(reviewCardSchema),
        defaultValues: { userAnswer: '' },
        mode: 'onTouched',
    })
    const isBusy = isLoading || isSubmitting

    const onSubmit = handleSubmit(async ({ userAnswer }) => {
        clearErrors('userAnswer')
        setSubmitError(undefined)

        try {
            const response = await reviewCard({
                cardId,
                deckId,
                userAnswer,
            }).unwrap()
            onReviewed({ response, userAnswer })
        } catch (error) {
            const message = getApiFieldErrors(error).userAnswer
            if (message) {
                setError('userAnswer', { type: 'server', message })
            } else {
                setSubmitError(error)
            }
        }
    })

    return (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
            <fieldset disabled={isBusy}>
                <FormField
                    label="Your answer"
                    error={errors.userAnswer?.message}
                    required
                >
                    <Input
                        {...register('userAnswer')}
                        autoComplete="off"
                        autoFocus
                        maxLength={100}
                        placeholder="Type your answer here..."
                    />
                </FormField>

                {submitError !== undefined && (
                    <ApiErrorPresentation
                        error={submitError}
                        mode="inline"
                        title="Unable to check answer"
                    />
                )}

                <Button
                    type="submit"
                    isLoading={isBusy}
                    loadingLabel="Checking answer"
                >
                    Check answer
                </Button>
            </fieldset>
        </form>
    )
}
