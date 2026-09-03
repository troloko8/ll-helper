import { describe, expect, it } from 'vitest'
import {
    getApiErrorPresentation,
    getApiFieldErrors,
    isApiError,
} from './error-presentation'

describe('error presentation contract', () => {
    it.each([
        [400, 'bad-request'],
        [401, 'unauthorized'],
        [403, 'forbidden'],
        [404, 'not-found'],
        [409, 'conflict'],
        [429, 'rate-limited'],
        [500, 'server-error'],
        [503, 'server-error'],
    ] as const)('maps status %i to %s', (status, kind) => {
        expect(
            getApiErrorPresentation({ status, message: 'Backend details' })
                .kind,
        ).toBe(kind)
    })

    it('does not expose an unexpected server error message', () => {
        const presentation = getApiErrorPresentation({
            status: 500,
            message: 'SQL connection details',
        })

        expect(presentation.message).not.toContain('SQL connection details')
    })

    it('falls back safely for non-API errors', () => {
        expect(isApiError(new Error('Network failed'))).toBe(false)
        expect(getApiErrorPresentation(new Error('Network failed')).kind).toBe(
            'unknown',
        )
    })

    it('extracts backend field validation errors from a 400 response', () => {
        expect(
            getApiFieldErrors({
                status: 400,
                message: 'Validation failed',
                data: {
                    errors: {
                        email: 'Email must be valid',
                        password: 'Password is required',
                        ignored: null,
                    },
                },
            }),
        ).toEqual({
            email: 'Email must be valid',
            password: 'Password is required',
        })
    })

    it('does not treat non-validation responses as field errors', () => {
        expect(
            getApiFieldErrors({
                status: 409,
                message: 'Email is already registered',
            }),
        ).toEqual({})
    })
})
