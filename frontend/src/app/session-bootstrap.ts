import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import {
    sessionAuthenticated,
    sessionCleared,
    sessionNeedsProfile,
} from '@/entities/session'
import { userApi } from '@/entities/user'
import { getToken, isApiError } from '@/shared/api'

type SessionBootstrapDispatch = ThunkDispatch<unknown, unknown, UnknownAction>

export async function bootstrapSession(
    dispatch: SessionBootstrapDispatch,
): Promise<void> {
    if (!getToken()) {
        dispatch(sessionCleared())
        return
    }

    const request = dispatch(
        userApi.endpoints.getCurrentUser.initiate(undefined, {
            forceRefetch: true,
        }),
    )

    try {
        const result = await request

        if (result.isSuccess) {
            dispatch(sessionAuthenticated())
        } else if (isApiError(result.error) && result.error.status === 404) {
            dispatch(sessionNeedsProfile())
        }
    } finally {
        request.unsubscribe()
    }
}
