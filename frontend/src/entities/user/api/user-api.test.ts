import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { clearToken, setToken } from '@/shared/api'
import { createApiTestStore, server } from '@/shared/lib/test'
import { userApi } from './user-api'
import type { UserResponseDto } from '../model/types'

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

describe('userApi', () => {
    afterEach(() => {
        clearToken()
    })

    it('gets the current user with the persisted Bearer token', async () => {
        setToken('current-user-token')
        server.use(
            http.get('http://localhost/api/v1/users/me', ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer current-user-token',
                )
                return HttpResponse.json(currentUser)
            }),
        )

        const store = createApiTestStore()
        const request = store.dispatch(
            userApi.endpoints.getCurrentUser.initiate(),
        )
        const result = await request.unwrap()
        request.unsubscribe()

        expect(result).toEqual(currentUser)
    })
})
