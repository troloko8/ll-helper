import { Navigate, Outlet } from 'react-router-dom'
import { PageState } from '@/shared/ui'
import { selectIsAuthenticated, selectSessionStatus } from '@/entities/session'
import { useAppSelector } from '../hooks'
import styles from '../error-surface.module.css'

export function ProtectedRoute() {
    const status = useAppSelector(selectSessionStatus)
    const isAuthenticated = useAppSelector(selectIsAuthenticated)

    if (status === 'initializing') {
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

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}
