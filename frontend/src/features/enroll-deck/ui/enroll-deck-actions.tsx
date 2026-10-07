import { useState } from 'react'
import { isApiError } from '@/shared/api'
import { ApiErrorPresentation, Button } from '@/shared/ui'
import { useEnrollDeckMutation } from '../api/enroll-deck-api'
import styles from './enroll-deck-actions.module.css'

export interface EnrollDeckActionsProps {
    deckId: number
    isEnrolled: boolean
    hasStudyCards: boolean
    reconcileEnrollment: () => Promise<boolean>
    onStartLearning: () => void | Promise<void>
}

type EnrollmentAction = 'enroll' | 'start'
type EnrollmentError = {
    action: EnrollmentAction
    error: unknown
}

export function EnrollDeckActions({
    deckId,
    isEnrolled,
    hasStudyCards,
    reconcileEnrollment,
    onStartLearning,
}: EnrollDeckActionsProps) {
    const [submitError, setSubmitError] = useState<EnrollmentError>()
    const [pendingAction, setPendingAction] = useState<EnrollmentAction>()
    const [enrollDeck, { isLoading }] = useEnrollDeckMutation()

    const handleAction = async (action: EnrollmentAction) => {
        setSubmitError(undefined)

        if (action === 'start' && isEnrolled) {
            await onStartLearning()
            return
        }

        setPendingAction(action)

        try {
            await enrollDeck(deckId).unwrap()
            if (action === 'start') {
                await onStartLearning()
            }
        } catch (error) {
            if (isApiError(error) && error.status === 409) {
                try {
                    const enrollmentIsCurrent = await reconcileEnrollment()

                    if (enrollmentIsCurrent) {
                        if (action === 'start') {
                            await onStartLearning()
                        }
                        return
                    }
                } catch (reconciliationError) {
                    setSubmitError({ action, error: reconciliationError })
                    return
                }
            }

            setSubmitError({ action, error })
        } finally {
            setPendingAction(undefined)
        }
    }

    return (
        <div className={styles.action}>
            {hasStudyCards ? (
                <Button
                    className={styles.button}
                    disabled={isLoading}
                    isLoading={pendingAction === 'start'}
                    loadingLabel="Starting learning"
                    onClick={() => void handleAction('start')}
                >
                    Start Learning
                </Button>
            ) : (
                <p className={styles.emptyStudyMessage} role="status">
                    This deck has no cards to study yet.
                </p>
            )}

            {!isEnrolled && (
                <Button
                    className={styles.button}
                    variant="secondary"
                    disabled={isLoading}
                    isLoading={pendingAction === 'enroll'}
                    loadingLabel="Enrolling"
                    onClick={() => void handleAction('enroll')}
                >
                    Enroll
                </Button>
            )}

            {submitError !== undefined && (
                <ApiErrorPresentation
                    error={submitError.error}
                    mode="inline"
                    title={
                        submitError.action === 'enroll'
                            ? 'Unable to enroll deck'
                            : 'Unable to start learning'
                    }
                />
            )}
        </div>
    )
}
