import type { ApiError } from './types'

export type ApiErrorPresentationKind =
    | 'bad-request'
    | 'unauthorized'
    | 'forbidden'
    | 'not-found'
    | 'conflict'
    | 'rate-limited'
    | 'server-error'
    | 'unknown'

export interface ApiErrorPresentation {
    kind: ApiErrorPresentationKind
    title: string
    message: string
}

const presentations: Record<ApiErrorPresentationKind, ApiErrorPresentation> = {
    'bad-request': {
        kind: 'bad-request',
        title: 'Check your input',
        message: 'Some of the submitted information could not be accepted.',
    },
    unauthorized: {
        kind: 'unauthorized',
        title: 'Session expired',
        message: 'Sign in again to continue.',
    },
    forbidden: {
        kind: 'forbidden',
        title: 'Access denied',
        message: "You don't have permission to perform this action.",
    },
    'not-found': {
        kind: 'not-found',
        title: 'Not found',
        message: 'The requested resource could not be found.',
    },
    conflict: {
        kind: 'conflict',
        title: 'Action unavailable',
        message:
            'This action conflicts with the current state. Refresh and try again.',
    },
    'rate-limited': {
        kind: 'rate-limited',
        title: 'Too many requests',
        message: 'Wait a moment before trying again.',
    },
    'server-error': {
        kind: 'server-error',
        title: 'Service unavailable',
        message: 'Something went wrong on our side. Try again later.',
    },
    unknown: {
        kind: 'unknown',
        title: 'Request failed',
        message: 'We could not complete the request. Try again.',
    },
}

export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof error.status === 'number' &&
        'message' in error &&
        typeof error.message === 'string'
    )
}

export function getApiErrorPresentation(error: unknown): ApiErrorPresentation {
    if (!isApiError(error)) {
        return presentations.unknown
    }

    switch (error.status) {
        case 400:
            return presentations['bad-request']
        case 401:
            return presentations.unauthorized
        case 403:
            return presentations.forbidden
        case 404:
            return presentations['not-found']
        case 409:
            return presentations.conflict
        case 429:
            return presentations['rate-limited']
        default:
            return error.status >= 500 && error.status <= 599
                ? presentations['server-error']
                : presentations.unknown
    }
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
    if (!isApiError(error) || error.status !== 400) {
        return {}
    }

    const data = error.data
    if (typeof data !== 'object' || data === null || !('errors' in data)) {
        return {}
    }

    const errors = data.errors
    if (
        typeof errors !== 'object' ||
        errors === null ||
        Array.isArray(errors)
    ) {
        return {}
    }

    return Object.fromEntries(
        Object.entries(errors).filter(
            (entry): entry is [string, string] =>
                typeof entry[1] === 'string' && entry[1].trim().length > 0,
        ),
    )
}
