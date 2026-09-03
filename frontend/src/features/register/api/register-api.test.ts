import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { createApiTestStore, server } from '@/shared/lib/test'
import { registerApi } from './register-api'
import type { RegisterRequestDto } from '../model/types'

describe('registerApi', () => {
    it('posts registration data and returns the access token', async () => {
        const registration: RegisterRequestDto = {
            email: 'new-user@example.com',
            password: 'password123',
        }

        server.use(
            http.post(
                'http://localhost/api/v1/auth/register',
                async ({ request }) => {
                    expect(await request.json()).toEqual(registration)
                    return HttpResponse.json({ accessToken: 'register-token' })
                },
            ),
        )

        const store = createApiTestStore()
        const result = await store
            .dispatch(registerApi.endpoints.register.initiate(registration))
            .unwrap()

        expect(result).toEqual({ accessToken: 'register-token' })
    })
})
