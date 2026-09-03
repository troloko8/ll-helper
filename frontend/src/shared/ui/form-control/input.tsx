import type { ComponentPropsWithRef } from 'react'
import styles from './form-control.module.css'

export type InputProps = ComponentPropsWithRef<'input'> & {
    invalid?: boolean
}

export function Input({
    invalid = false,
    className,
    ref,
    'aria-invalid': ariaInvalid,
    ...props
}: InputProps) {
    const classes = [styles.control, className].filter(Boolean).join(' ')

    return (
        <input
            {...props}
            ref={ref}
            className={classes}
            aria-invalid={ariaInvalid ?? (invalid || undefined)}
        />
    )
}
