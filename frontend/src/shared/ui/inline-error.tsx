import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { ErrorIcon } from './error-icon'
import styles from './inline-error.module.css'

export type InlineErrorProps = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & {
  title?: ReactNode
  message: ReactNode
  action?: ReactNode
}

export function InlineError({
  title,
  message,
  action,
  className,
  role = 'alert',
  'aria-live': ariaLive,
  'aria-atomic': ariaAtomic,
  ...props
}: InlineErrorProps) {
  const classes = [styles.error, className].filter(Boolean).join(' ')

  return (
    <div
      {...props}
      className={classes}
      role={role}
      aria-live={ariaLive ?? (role === 'alert' ? 'assertive' : 'polite')}
      aria-atomic={ariaAtomic ?? true}
    >
      <ErrorIcon className={styles.icon} />
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        <p className={styles.message}>{message}</p>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
