import { useCallback } from 'react'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
    sessionAuthenticated,
    sessionNeedsProfile,
    type AuthResponseDto,
} from '@/entities/session'
import { userApi } from '@/entities/user'
import { isApiError, setToken } from '@/shared/api'

type LoginOrchestrationDispatch = ThunkDispatch<unknown, unknown, UnknownAction>

export function useLoginOrchestration() {
    const dispatch = useDispatch<LoginOrchestrationDispatch>()
    const navigate = useNavigate()

    return useCallback(
        async (response: AuthResponseDto) => {
            setToken(response.accessToken)

            // TODO: Extract a shared current-user session resolver and reuse it in bootstrapSession.
            const request = dispatch(
                userApi.endpoints.getCurrentUser.initiate(undefined, {
                    forceRefetch: true,
                }),
            )

            try {
                const result = await request

                if (result.isSuccess) {
                    dispatch(sessionAuthenticated())
                    navigate('/learning', { replace: true })
                    return
                }

                if (isApiError(result.error) && result.error.status === 404) {
                    dispatch(sessionNeedsProfile())
                    navigate('/onboarding/profile', { replace: true })
                    return
                }

                if (isApiError(result.error) && result.error.status === 401) {
                    navigate('/login', { replace: true })
                    return
                }

                throw result.error
            } finally {
                request.unsubscribe()
            }
        },
        [dispatch, navigate],
    )
}
