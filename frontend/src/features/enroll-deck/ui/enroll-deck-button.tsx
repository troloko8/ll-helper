import { useState } from 'react'
import type { EnrollResponseDto } from '@/entities/learning'
import { isApiError } from '@/shared/api'
import { ApiErrorPresentation, Button } from '@/shared/ui'
import { useEnrollDeckMutation } from '../api/enroll-deck-api'
import styles from './enroll-deck-button.module.css'

export interface EnrollDeckButtonProps {
    deckId: number
    onSuccess?: (response: EnrollResponseDto) => void | Promise<void>
}

export function EnrollDeckButton({ deckId, onSuccess }: EnrollDeckButtonProps) {
    const [submitError, setSubmitError] = useState<unknown>()
    const [enrollDeck, { isLoading }] = useEnrollDeckMutation()

    const handleEnroll = async () => {
        setSubmitError(undefined)

        try {
            const response = await enrollDeck(deckId).unwrap()
            await onSuccess?.(response)
        } catch (error) {
            setSubmitError(error)
        }
    }

    const duplicateEnrollment =
        isApiError(submitError) && submitError.status === 409

    return (
        <div className={styles.action}>
            <Button
                className={styles.button}
                isLoading={isLoading}
                loadingLabel="Starting learning"
                onClick={() => void handleEnroll()}
            >
                Start learning
            </Button>

            {submitError !== undefined && (
                <ApiErrorPresentation
                    error={submitError}
                    mode="inline"
                    title={
                        duplicateEnrollment
                            ? 'Already enrolled'
                            : 'Unable to start learning'
                    }
                    message={
                        duplicateEnrollment
                            ? 'This deck is already in your Learning list.'
                            : undefined
                    }
                />
            )}
        </div>
    )
}
