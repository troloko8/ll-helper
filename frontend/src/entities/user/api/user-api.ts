import { baseApi } from '@/shared/api'
import type { UserResponseDto } from '../model/types'

export const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getCurrentUser: builder.query<UserResponseDto, void>({
            query: () => '/users/me',
        }),
    }),
})

export const { useGetCurrentUserQuery, useLazyGetCurrentUserQuery } = userApi
