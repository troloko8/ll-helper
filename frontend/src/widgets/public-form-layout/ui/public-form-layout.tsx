import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import styles from './public-form-layout.module.css'

export type PublicFormLayoutVariant = 'auth' | 'onboarding'

export type PublicFormLayoutProps = ComponentPropsWithoutRef<'div'> & {
    variant: PublicFormLayoutVariant
    header?: ReactNode
    children: ReactNode
}

export function PublicFormLayout({
    variant,
    header,
    children,
    className,
    ...props
}: PublicFormLayoutProps) {
    const classes = [
        styles.layout,
        styles[variant],
        header && styles.withHeader,
        className,
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <div {...props} className={classes}>
            {header && (
                <header className={styles.header}>
                    <div className={styles.headerContent}>{header}</div>
                </header>
            )}
            <main className={styles.main}>
                <div className={styles.content}>{children}</div>
            </main>
        </div>
    )
}
