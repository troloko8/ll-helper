import { createListenerMiddleware, isRejectedWithValue } from '@reduxjs/toolkit'
import { sessionCleared } from '@/entities/session'
import { clearToken } from '@/shared/api'
import type { ApiError } from '@/shared/api'

export const apiErrorListenerMiddleware = createListenerMiddleware()

apiErrorListenerMiddleware.startListening({
  matcher: isRejectedWithValue,
  effect: (action, listenerApi) => {
    const payload = action.payload as ApiError | undefined
    if (payload?.status === 401) {
      clearToken()
      listenerApi.dispatch(sessionCleared())
    }
  },
})
