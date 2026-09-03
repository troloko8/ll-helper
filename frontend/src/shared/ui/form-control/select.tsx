import type { ComponentPropsWithRef } from 'react'
import styles from './form-control.module.css'

export type SelectProps = ComponentPropsWithRef<'select'> & {
  invalid?: boolean
}

export function Select({
  invalid = false,
  className,
  ref,
  'aria-invalid': ariaInvalid,
  ...props
}: SelectProps) {
  const classes = [styles.control, styles.select, className]
    .filter(Boolean)
    .join(' ')

  return (
    <select
      {...props}
      ref={ref}
      className={classes}
      aria-invalid={ariaInvalid ?? (invalid || undefined)}
    />
  )
}
