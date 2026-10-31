import type { UserResponseDto } from '@/entities/user'
import { userApi } from '@/entities/user'
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
            invalidatesTags: ['CurrentUser'],
            async onQueryStarted(_profile, { dispatch, queryFulfilled }) {
                let createdUser: UserResponseDto

                try {
                    ;({ data: createdUser } = await queryFulfilled)
                } catch {
                    // The form owns mutation error presentation and retry.
                    return
                }

                await dispatch(
                    userApi.util.upsertQueryData(
                        'getCurrentUser',
                        undefined,
                        createdUser,
                    ),
                )
            },
        }),
    }),
})

export const { useCreateUserMutation } = completeProfileApi
