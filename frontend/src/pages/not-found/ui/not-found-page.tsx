import { PageState } from '@/shared/ui'
import styles from './not-found-page.module.css'

export function NotFoundPage() {
    return (
        <main className={styles.page}>
            <PageState
                variant="error"
                title="Page not found"
                description="The page you requested does not exist."
            />
        </main>
    )
}
