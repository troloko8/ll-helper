import { sessionAuthenticated, sessionCleared } from '@/entities/session'
import { getToken } from '@/shared/api'

type SessionBootstrapAction =
    | ReturnType<typeof sessionAuthenticated>
    | ReturnType<typeof sessionCleared>

type SessionBootstrapDispatch = (action: SessionBootstrapAction) => unknown

export function bootstrapSession(dispatch: SessionBootstrapDispatch): void {
    if (getToken()) {
        dispatch(sessionAuthenticated())
    } else {
        dispatch(sessionCleared())
    }
}
