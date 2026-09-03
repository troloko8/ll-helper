import type { ComponentPropsWithoutRef } from 'react'

type ErrorIconProps = ComponentPropsWithoutRef<'svg'>

export function ErrorIcon(props: ErrorIconProps) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.75v5.5" />
      <path d="M12 16.5h.01" />
    </svg>
  )
}
