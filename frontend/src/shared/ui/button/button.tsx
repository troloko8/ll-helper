import type { ComponentPropsWithRef } from 'react'
import styles from './button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

export type ButtonProps = ComponentPropsWithRef<'button'> & {
    variant?: ButtonVariant
    isLoading?: boolean
    loadingLabel?: string
}

export function Button({
    variant = 'primary',
    isLoading = false,
    loadingLabel,
    className,
    children,
    disabled,
    type = 'button',
    ref,
    ...props
}: ButtonProps) {
    const classes = [styles.button, styles[variant], className]
        .filter(Boolean)
        .join(' ')

    return (
        <button
            {...props}
            ref={ref}
            type={type}
            className={classes}
            disabled={disabled || isLoading}
            aria-busy={isLoading || undefined}
        >
            {isLoading && (
                <span className={styles.spinner} aria-hidden="true" />
            )}
            <span>{isLoading && loadingLabel ? loadingLabel : children}</span>
        </button>
    )
}
