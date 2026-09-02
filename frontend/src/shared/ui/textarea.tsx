import type { ComponentPropsWithRef } from 'react'
import styles from './form-control.module.css'

export type TextareaProps = ComponentPropsWithRef<'textarea'> & {
  invalid?: boolean
}

export function Textarea({
  invalid = false,
  className,
  ref,
  'aria-invalid': ariaInvalid,
  ...props
}: TextareaProps) {
  const classes = [styles.control, styles.textarea, className]
    .filter(Boolean)
    .join(' ')

  return (
    <textarea
      {...props}
      ref={ref}
      className={classes}
      aria-invalid={ariaInvalid ?? (invalid || undefined)}
    />
  )
}
