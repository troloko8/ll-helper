import { baseApi } from '@/shared/api'
import type { UserResponseDto } from '../model/types'

export const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getCurrentUser: builder.query<UserResponseDto, void>({
            query: () => '/users/me',
        }),
        getUserByUsername: builder.query<UserResponseDto, string>({
            query: (username) =>
                `/users/username/${encodeURIComponent(username)}`,
        }),
    }),
})

export const {
    useGetCurrentUserQuery,
    useGetUserByUsernameQuery,
    useLazyGetCurrentUserQuery,
} = userApi
