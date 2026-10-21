import { bootstrapSession } from '../session-bootstrap'
import { useAppDispatch } from '../hooks'
import { Button, PageState } from '@/shared/ui'
import styles from '../error-surface.module.css'

export function SessionBootstrapError() {
    const dispatch = useAppDispatch()

    return (
        <main className={styles.surface}>
            <PageState
                variant="error"
                title="Unable to verify your session"
                description="Check your connection and try again. Your saved session has not been cleared."
                action={
                    <Button
                        variant="secondary"
                        onClick={() => void bootstrapSession(dispatch)}
                    >
                        Try again
                    </Button>
                }
            />
        </main>
    )
}
