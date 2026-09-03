import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { getToken } from './token-storage'
import type { ApiError } from './types'

const rawBaseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
    prepareHeaders: (headers) => {
        const token = getToken()
        if (token) {
            headers.set('Authorization', `Bearer ${token}`)
        }
        return headers
    },
})

function extractErrorMessage(data: unknown): string | undefined {
    if (data && typeof data === 'object' && 'message' in data) {
        const message = (data as { message?: unknown }).message
        if (typeof message === 'string') {
            return message
        }
    }
    return undefined
}

function normalizeError(error: FetchBaseQueryError): ApiError {
    return {
        status: typeof error.status === 'number' ? error.status : 0,
        message: extractErrorMessage(error.data) ?? 'Request failed',
        data: error.data,
    }
}

const baseQueryWithErrorNormalization: BaseQueryFn<
    string | FetchArgs,
    unknown,
    ApiError
> = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions)

    if (result.error) {
        return { error: normalizeError(result.error) }
    }

    return { data: result.data, meta: result.meta }
}

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithErrorNormalization,
    endpoints: () => ({}),
})
