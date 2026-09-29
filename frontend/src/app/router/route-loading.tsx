import { Outlet, useNavigation } from 'react-router-dom'
import { PageState } from '@/shared/ui'
import styles from '../error-surface.module.css'
import loadingStyles from './route-loading.module.css'

export function RouteLoading() {
    return (
        <main className={styles.surface}>
            <PageState
                variant="loading"
                title="Loading page"
                description="Please wait while the page opens."
            />
        </main>
    )
}

export function RoutePending() {
    const navigation = useNavigation()

    return (
        <>
            {navigation.state !== 'idle' && (
                <p
                    className={loadingStyles.pending}
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                >
                    Loading page…
                </p>
            )}
            <Outlet />
        </>
    )
}
