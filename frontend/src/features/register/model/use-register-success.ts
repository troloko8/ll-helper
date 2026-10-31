import { useCallback } from 'react'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
    sessionNeedsProfile,
    userScopedStateReset,
    type AuthResponseDto,
} from '@/entities/session'
import { baseApi, setToken } from '@/shared/api'

type RegisterSuccessDispatch = ThunkDispatch<unknown, unknown, UnknownAction>

export function useRegisterSuccess() {
    const dispatch = useDispatch<RegisterSuccessDispatch>()
    const navigate = useNavigate()

    return useCallback(
        (response: AuthResponseDto) => {
            setToken(response.accessToken)
            dispatch(userScopedStateReset())
            dispatch(baseApi.util.resetApiState())
            dispatch(sessionNeedsProfile())
            navigate('/onboarding/profile', { replace: true })
        },
        [dispatch, navigate],
    )
}
