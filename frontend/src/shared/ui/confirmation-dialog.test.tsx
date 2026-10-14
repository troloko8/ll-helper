import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ConfirmationDialog } from './confirmation-dialog'

let focusBeforeDialog: HTMLElement | null = null
let originalShowModal: PropertyDescriptor | undefined
let originalClose: PropertyDescriptor | undefined

function installDialogMethods() {
    originalShowModal = Object.getOwnPropertyDescriptor(
        HTMLDialogElement.prototype,
        'showModal',
    )
    originalClose = Object.getOwnPropertyDescriptor(
        HTMLDialogElement.prototype,
        'close',
    )
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
        configurable: true,
        value(this: HTMLDialogElement) {
            focusBeforeDialog = document.activeElement as HTMLElement
            this.setAttribute('open', '')
            ;(this.querySelector('button') as HTMLElement | null)?.focus()
        },
    })
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
        configurable: true,
        value(this: HTMLDialogElement) {
            this.removeAttribute('open')
            focusBeforeDialog?.focus()
        },
    })
}

function restoreDialogMethods() {
    if (originalShowModal) {
        Object.defineProperty(
            HTMLDialogElement.prototype,
            'showModal',
            originalShowModal,
        )
    } else {
        Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
    }
    if (originalClose) {
        Object.defineProperty(
            HTMLDialogElement.prototype,
            'close',
            originalClose,
        )
    } else {
        Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
    }
    focusBeforeDialog = null
}

function DialogHarness() {
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>
                Open confirmation
            </button>
            <ConfirmationDialog
                open={open}
                title="Delete item?"
                description="This action cannot be undone."
                confirmLabel="Delete item"
                busyLabel="Deleting item"
                isBusy={busy}
                onCancel={() => setOpen(false)}
                onConfirm={() => setBusy(true)}
            />
        </>
    )
}

describe('ConfirmationDialog', () => {
    beforeEach(installDialogMethods)
    afterEach(restoreDialogMethods)

    it('focuses Cancel and restores focus after the native Escape cancel event', async () => {
        const user = userEvent.setup()
        render(<DialogHarness />)
        const opener = screen.getByRole('button', { name: 'Open confirmation' })

        await user.click(opener)

        const dialog = screen.getByRole('dialog', { name: 'Delete item?' })
        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()

        act(() => {
            fireEvent(
                dialog,
                new Event('cancel', { bubbles: false, cancelable: true }),
            )
        })

        expect(
            screen.queryByRole('dialog', { name: 'Delete item?' }),
        ).not.toBeInTheDocument()
        expect(opener).toHaveFocus()
    })

    it('blocks cancellation while the destructive action is busy', async () => {
        const user = userEvent.setup()
        render(<DialogHarness />)
        await user.click(
            screen.getByRole('button', { name: 'Open confirmation' }),
        )
        const dialog = screen.getByRole('dialog', { name: 'Delete item?' })

        await user.click(screen.getByRole('button', { name: 'Delete item' }))

        expect(
            screen.getByRole('button', { name: 'Deleting item' }),
        ).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
        fireEvent(
            dialog,
            new Event('cancel', { bubbles: false, cancelable: true }),
        )
        expect(
            screen.getByRole('dialog', { name: 'Delete item?' }),
        ).toBeInTheDocument()
    })
})
