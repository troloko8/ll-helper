import type { ComponentPropsWithoutRef, CSSProperties } from 'react'
import styles from './skeleton.module.css'

export type SkeletonVariant = 'text' | 'rectangular' | 'circular'

export type SkeletonProps = ComponentPropsWithoutRef<'div'> & {
  variant?: SkeletonVariant
  width?: CSSProperties['width']
  height?: CSSProperties['height']
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  style,
  'aria-hidden': ariaHidden = true,
  ...props
}: SkeletonProps) {
  const classes = [styles.skeleton, styles[variant], className]
    .filter(Boolean)
    .join(' ')
  const dimensions = {
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
  }

  return (
    <div
      {...props}
      className={classes}
      style={{ ...style, ...dimensions }}
      aria-hidden={ariaHidden}
    />
  )
}
