import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw/server'
;(
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
    server.resetHandlers()
    cleanup()
})

afterAll(() => server.close())
