import { Navigate, Outlet } from 'react-router-dom'
import { selectIsAuthenticated, selectSessionStatus } from '@/entities/session'
import { useAppSelector } from '../hooks'

export function ProtectedRoute() {
    const status = useAppSelector(selectSessionStatus)
    const isAuthenticated = useAppSelector(selectIsAuthenticated)

    if (status === 'initializing') {
        return null
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}
