import { cloneElement, useId } from 'react'
import type { AriaAttributes, ReactElement, ReactNode } from 'react'
import styles from './form-field.module.css'

interface FormControlProps {
  id?: string
  required?: boolean
  disabled?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: AriaAttributes['aria-invalid']
}

export interface FormFieldProps {
  label: ReactNode
  children: ReactElement<FormControlProps>
  id?: string
  description?: ReactNode
  error?: ReactNode
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FormField({
  label,
  children,
  id,
  description,
  error,
  required = false,
  disabled = false,
  className,
}: FormFieldProps) {
  const generatedId = useId()
  const controlId = children.props.id ?? id ?? `field-${generatedId}`
  const descriptionId = description ? `${controlId}-description` : undefined
  const errorId = `${controlId}-error`
  const hasError = error !== undefined && error !== null && error !== ''
  const isRequired = Boolean(children.props.required || required)
  const isDisabled = Boolean(children.props.disabled || disabled)
  const describedBy = [
    children.props['aria-describedby'],
    descriptionId,
    hasError ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(' ')
  const classes = [styles.field, className].filter(Boolean).join(' ')

  const control = cloneElement(children, {
    id: controlId,
    required: isRequired,
    disabled: isDisabled,
    'aria-describedby': describedBy || undefined,
    'aria-invalid':
      children.props['aria-invalid'] ?? (hasError ? true : undefined),
  })

  return (
    <div className={classes} data-disabled={isDisabled || undefined}>
      <label className={styles.label} htmlFor={controlId}>
        {label}
        {isRequired && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {control}
      {description && (
        <p className={styles.description} id={descriptionId}>
          {description}
        </p>
      )}
      <p
        className={styles.error}
        id={errorId}
        aria-live="polite"
        aria-atomic="true"
      >
        {error}
      </p>
    </div>
  )
}
