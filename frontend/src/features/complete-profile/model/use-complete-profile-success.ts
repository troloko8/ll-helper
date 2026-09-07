import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { sessionAuthenticated } from '@/entities/session'

export function useCompleteProfileSuccess() {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    return useCallback(() => {
        dispatch(sessionAuthenticated())
        navigate('/learning', { replace: true })
    }, [dispatch, navigate])
}
