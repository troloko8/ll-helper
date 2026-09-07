import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { sessionNeedsProfile, type AuthResponseDto } from '@/entities/session'
import { setToken } from '@/shared/api'

export function useRegisterSuccess() {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    return useCallback(
        (response: AuthResponseDto) => {
            setToken(response.accessToken)
            dispatch(sessionNeedsProfile())
            navigate('/onboarding/profile', { replace: true })
        },
        [dispatch, navigate],
    )
}
