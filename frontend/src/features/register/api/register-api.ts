import type { AuthResponseDto } from '@/entities/session'
import { baseApi } from '@/shared/api'
import type { RegisterRequestDto } from '../model/types'

export const registerApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation<AuthResponseDto, RegisterRequestDto>({
            query: (credentials) => ({
                url: '/auth/register',
                method: 'POST',
                body: credentials,
            }),
        }),
    }),
})

export const { useRegisterMutation } = registerApi
