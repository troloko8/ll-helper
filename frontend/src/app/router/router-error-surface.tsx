import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Button, PageState } from '@/shared/ui'
import styles from '../error-surface.module.css'

interface ErrorContent {
    title: string
    description: string
}

function getErrorContent(error: unknown): ErrorContent {
    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            return {
                title: 'Page not found',
                description:
                    'The requested page does not exist or is no longer available.',
            }
        }

        if (error.status === 403) {
            return {
                title: 'Access denied',
                description: 'You do not have permission to open this page.',
            }
        }
    }

    return {
        title: 'Unable to load this page',
        description:
            'An unexpected routing error occurred. Try reloading the page.',
    }
}

export function RouterErrorSurface() {
    const content = getErrorContent(useRouteError())

    return (
        <main className={styles.surface}>
            <PageState
                variant="error"
                title={content.title}
                description={content.description}
                action={
                    <Button onClick={() => window.location.reload()}>
                        Reload page
                    </Button>
                }
            />
        </main>
    )
}
