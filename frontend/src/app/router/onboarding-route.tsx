import { Navigate, Outlet } from 'react-router-dom'
import { selectSessionStatus } from '@/entities/session'
import { useAppSelector } from '../hooks'
import { SessionLoading } from './session-loading'

export function OnboardingRoute() {
    const status = useAppSelector(selectSessionStatus)

    if (status === 'initializing') {
        return <SessionLoading />
    }

    if (status === 'anonymous') {
        return <Navigate to="/login" replace />
    }

    if (status === 'authenticated') {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
