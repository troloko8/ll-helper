import { PageState } from '@/shared/ui'
import styles from '../error-surface.module.css'

export function SessionLoading() {
    return (
        <main className={styles.surface}>
            <PageState
                variant="loading"
                title="Preparing your workspace"
                description="Checking your session before opening the application."
            />
        </main>
    )
}
