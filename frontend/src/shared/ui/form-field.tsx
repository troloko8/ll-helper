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
  const errorId = error ? `${controlId}-error` : undefined
  const isRequired = children.props.required ?? required
  const describedBy = [
    children.props['aria-describedby'],
    descriptionId,
    errorId,
  ]
    .filter(Boolean)
    .join(' ')
  const classes = [styles.field, className].filter(Boolean).join(' ')

  const control = cloneElement(children, {
    id: controlId,
    required: isRequired,
    disabled: children.props.disabled ?? disabled,
    'aria-describedby': describedBy || undefined,
    'aria-invalid':
      children.props['aria-invalid'] ?? (error ? true : undefined),
  })

  return (
    <div className={classes}>
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
      {error && (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
