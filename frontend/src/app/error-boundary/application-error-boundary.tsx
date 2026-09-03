import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button, PageState } from '@/shared/ui'
import styles from '../error-surface.module.css'

export interface ApplicationErrorBoundaryProps {
    children: ReactNode
}

interface ApplicationErrorBoundaryState {
    hasError: boolean
}

export class ApplicationErrorBoundary extends Component<
    ApplicationErrorBoundaryProps,
    ApplicationErrorBoundaryState
> {
    state: ApplicationErrorBoundaryState = { hasError: false }

    static getDerivedStateFromError(): ApplicationErrorBoundaryState {
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Unhandled application error', error, errorInfo)
    }

    private handleReload = (): void => {
        window.location.reload()
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <main className={styles.surface}>
                    <PageState
                        variant="error"
                        title="Something went wrong"
                        description="The application encountered an unexpected error. Reload the page to continue."
                        action={
                            <Button onClick={this.handleReload}>
                                Reload application
                            </Button>
                        }
                    />
                </main>
            )
        }

        return this.props.children
    }
}
