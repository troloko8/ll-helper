import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { selectSessionStatus } from '@/entities/session'
import type { UserResponseDto } from '@/entities/user'
import { baseApi, getToken, setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { bootstrapSession } from './session-bootstrap'
import { createAppStore } from './store'

const currentUser: UserResponseDto = {
    id: 42,
    username: 'learner',
    firstName: 'Test',
    lastName: 'Learner',
    nativeLanguage: 'en',
    targetLanguage: 'ru',
    avatarUrl: null,
    uiLanguage: 'en',
    createdAt: '2026-09-03T00:00:00Z',
    updatedAt: '2026-09-03T00:00:00Z',
}

describe('bootstrapSession', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('marks the session anonymous without requesting a profile when no token exists', async () => {
        let requestCount = 0
        server.use(
            http.get('*/users/me', () => {
                requestCount += 1
                return HttpResponse.json(currentUser)
            }),
        )
        const store = createAppStore()

        await bootstrapSession(store.dispatch)

        expect(selectSessionStatus(store.getState())).toBe('anonymous')
        expect(requestCount).toBe(0)
    })

    it('marks the session authenticated when the current profile exists', async () => {
        setToken('valid-token')
        server.use(http.get('*/users/me', () => HttpResponse.json(currentUser)))
        const store = createAppStore()

        await bootstrapSession(store.dispatch)

        expect(selectSessionStatus(store.getState())).toBe('authenticated')
        expect(getToken()).toBe('valid-token')
    })

    it('marks the session as needing a profile when users/me returns 404', async () => {
        setToken('profile-pending-token')
        server.use(
            http.get('*/users/me', () =>
                HttpResponse.json(
                    { message: 'User profile not found' },
                    { status: 404 },
                ),
            ),
        )
        const store = createAppStore()

        await bootstrapSession(store.dispatch)

        expect(selectSessionStatus(store.getState())).toBe('needsProfile')
        expect(getToken()).toBe('profile-pending-token')
    })

    it('clears the token, session, and API cache when users/me returns 401', async () => {
        setToken('expired-token')
        server.use(
            http.get('*/users/me', () =>
                HttpResponse.json(
                    { message: 'Authentication required' },
                    { status: 401 },
                ),
            ),
        )
        const store = createAppStore()

        await bootstrapSession(store.dispatch)

        expect(getToken()).toBeNull()
        expect(selectSessionStatus(store.getState())).toBe('anonymous')
        expect(store.getState()[baseApi.reducerPath].queries).toEqual({})
    })
})
