import type { Dispatch } from '@reduxjs/toolkit'
import { sessionCleared } from '@/entities/session'
import { baseApi, clearToken } from '@/shared/api'

export function logout(dispatch: Dispatch): void {
    clearToken()
    dispatch(sessionCleared())
    dispatch(baseApi.util.resetApiState())
}
