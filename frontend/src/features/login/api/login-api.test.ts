import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { createApiTestStore, server } from '@/shared/lib/test'
import { loginApi } from './login-api'
import type { LoginRequestDto } from '../model/types'

describe('loginApi', () => {
    it('posts credentials and returns the access token', async () => {
        const credentials: LoginRequestDto = {
            email: 'learner@example.com',
            password: 'password123',
        }

        server.use(
            http.post(
                'http://localhost/api/v1/auth/login',
                async ({ request }) => {
                    expect(await request.json()).toEqual(credentials)
                    return HttpResponse.json({ accessToken: 'login-token' })
                },
            ),
        )

        const store = createApiTestStore()
        const result = await store
            .dispatch(loginApi.endpoints.login.initiate(credentials))
            .unwrap()

        expect(result).toEqual({ accessToken: 'login-token' })
    })
})
