import { act } from 'react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { selectSessionStatus } from '@/entities/session'
import { baseApi, getToken, setToken } from '@/shared/api'
import { server } from '@/shared/lib/test'
import { createAppStore } from './store'

const testApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCachedValue: builder.query<{ value: string }, void>({
      query: () => '/__test-cache',
    }),
    triggerUnauthorized: builder.query<unknown, void>({
      query: () => '/__test-401',
    }),
  }),
  overrideExisting: false,
})

describe('api-error-listener', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('clears the token and marks the session anonymous when the API responds 401', async () => {
    setToken('test-token')
    server.use(
      http.get('*/__test-cache', () =>
        HttpResponse.json({ value: 'previous user data' }),
      ),
      http.get('*/__test-401', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    )

    const store = createAppStore()

    await act(async () => {
      await store.dispatch(testApi.endpoints.getCachedValue.initiate())
    })

    expect(Object.keys(store.getState().api.queries)).toHaveLength(1)

    await act(async () => {
      await store.dispatch(testApi.endpoints.triggerUnauthorized.initiate())
    })

    expect(getToken()).toBeNull()
    expect(selectSessionStatus(store.getState())).toBe('anonymous')
    expect(store.getState().api.queries).toEqual({})
  })
})
