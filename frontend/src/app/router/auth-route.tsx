import { Navigate, Outlet } from 'react-router-dom'
import { selectSessionStatus } from '@/entities/session'
import { useAppSelector } from '../hooks'
import { SessionLoading } from './session-loading'

export function AuthRoute() {
    const status = useAppSelector(selectSessionStatus)

    if (status === 'initializing') {
        return <SessionLoading />
    }

    if (status === 'needsProfile') {
        return <Navigate to="/onboarding/profile" replace />
    }

    if (status === 'authenticated') {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
