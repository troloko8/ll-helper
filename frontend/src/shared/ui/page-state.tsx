import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { ErrorIcon } from './error-icon'
import styles from './page-state.module.css'

export type PageStateVariant = 'loading' | 'error'

export type PageStateProps = Omit<ComponentPropsWithoutRef<'section'>, 'title'> & {
  variant: PageStateVariant
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function PageState({
  variant,
  title,
  description,
  action,
  className,
  role,
  'aria-live': ariaLive,
  ...props
}: PageStateProps) {
  const isLoading = variant === 'loading'
  const classes = [styles.state, styles[variant], className]
    .filter(Boolean)
    .join(' ')

  return (
    <section
      {...props}
      className={classes}
      role={role ?? (isLoading ? 'status' : 'alert')}
      aria-live={ariaLive ?? (isLoading ? 'polite' : 'assertive')}
      aria-busy={isLoading || undefined}
    >
      <div className={styles.icon} aria-hidden="true">
        {isLoading ? (
          <span className={styles.spinner} />
        ) : (
          <ErrorIcon className={styles.errorIcon} />
        )}
      </div>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </section>
  )
}
