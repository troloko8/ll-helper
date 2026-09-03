import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { clearToken, setToken } from '@/shared/api'
import { createApiTestStore, server } from '@/shared/lib/test'
import { completeProfileApi } from './complete-profile-api'
import type { CreateUserRequestDto } from '../model/types'

describe('completeProfileApi', () => {
    afterEach(() => {
        clearToken()
    })

    it('creates the user profile with the persisted Bearer token', async () => {
        const profile: CreateUserRequestDto = {
            firstName: 'Test',
            lastName: 'Learner',
            username: 'learner',
            nativeLanguage: 'en',
            targetLanguage: 'ru',
            avatarUrl: null,
            uiLanguage: 'en',
        }
        setToken('profile-token')

        server.use(
            http.post('http://localhost/api/v1/users', async ({ request }) => {
                expect(request.headers.get('Authorization')).toBe(
                    'Bearer profile-token',
                )
                expect(await request.json()).toEqual(profile)
                return HttpResponse.json({
                    id: 42,
                    ...profile,
                    createdAt: '2026-09-03T00:00:00Z',
                    updatedAt: '2026-09-03T00:00:00Z',
                })
            }),
        )

        const store = createApiTestStore()
        const result = await store
            .dispatch(completeProfileApi.endpoints.createUser.initiate(profile))
            .unwrap()

        expect(result).toMatchObject({ id: 42, username: 'learner' })
    })
})
