import type { AuthResponseDto } from '@/entities/session'
import { baseApi } from '@/shared/api'
import type { LoginRequestDto } from '../model/types'

export const loginApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponseDto, LoginRequestDto>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
    }),
})

export const { useLoginMutation } = loginApi
