import type { ReactNode } from 'react'
import { getApiErrorPresentation } from '@/shared/api'
import { InlineError } from './inline-error'
import { PageState } from './page-state'

export interface ApiErrorPresentationProps {
    error: unknown
    mode: 'page' | 'inline'
    title?: ReactNode
    message?: ReactNode
    action?: ReactNode
}

export function ApiErrorPresentation({
    error,
    mode,
    title,
    message,
    action,
}: ApiErrorPresentationProps) {
    const fallback = getApiErrorPresentation(error)
    const resolvedTitle = title ?? fallback.title
    const resolvedMessage = message ?? fallback.message

    if (mode === 'page') {
        return (
            <PageState
                variant="error"
                title={resolvedTitle}
                description={resolvedMessage}
                action={action}
            />
        )
    }

    return (
        <InlineError
            title={resolvedTitle}
            message={resolvedMessage}
            action={action}
        />
    )
}
