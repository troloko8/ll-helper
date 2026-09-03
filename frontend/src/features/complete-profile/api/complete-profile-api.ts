import type { UserResponseDto } from '@/entities/user'
import { baseApi } from '@/shared/api'
import type { CreateUserRequestDto } from '../model/types'

export const completeProfileApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createUser: builder.mutation<UserResponseDto, CreateUserRequestDto>({
            query: (profile) => ({
                url: '/users',
                method: 'POST',
                body: profile,
            }),
        }),
    }),
})

export const { useCreateUserMutation } = completeProfileApi
