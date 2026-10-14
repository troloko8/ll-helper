import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './button'
import styles from './confirmation-dialog.module.css'

export interface ConfirmationDialogProps {
    open: boolean
    title: string
    description: ReactNode
    confirmLabel: string
    busyLabel: string
    isBusy?: boolean
    error?: ReactNode
    onCancel: () => void
    onConfirm: () => void
}

export function ConfirmationDialog({
    open,
    title,
    description,
    confirmLabel,
    busyLabel,
    isBusy = false,
    error,
    onCancel,
    onConfirm,
}: ConfirmationDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        
        if (!dialog) {
            return
        }

        if (open && !dialog.open) {
            if (typeof dialog.showModal === 'function') {
                dialog.showModal()
            } else {
                dialog.setAttribute('open', '')
            }
        } else if (!open && dialog.open) {
            if (typeof dialog.close === 'function') {
                dialog.close()
            } else {
                dialog.removeAttribute('open')
            }
        }
    }, [open])

    return (
        <dialog
            ref={dialogRef}
            className={styles.dialog}
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-description"
            onCancel={(event) => {
                event.preventDefault()
                if (!isBusy) {
                    onCancel()
                }
            }}
        >
            <h2 id="confirmation-title">{title}</h2>
            <div id="confirmation-description" className={styles.description}>
                {description}
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.actions}>
                <Button
                    autoFocus
                    variant="secondary"
                    disabled={isBusy}
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    isLoading={isBusy}
                    loadingLabel={busyLabel}
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </Button>
            </div>
        </dialog>
    )
}
