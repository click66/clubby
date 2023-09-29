import { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import { createRoot } from 'react-dom/client'

interface ConfirmModalProps {
    title: string
    body: string
    onConfirm?: () => void
    onCancel?: () => void
}

function ConfirmModal({
    onConfirm = () => { },
    onCancel = () => { },
    title = '',
    body = ''
}: ConfirmModalProps) {
    const [open, setOpen] = useState<boolean>(true)

    const close = () => {
        setOpen(false)
    }

    return (
        <Modal
            show={open}
            onHide={close}
            centered
        >
            <Modal.Header>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{body}</Modal.Body>
            <Modal.Footer>
                <Button onClick={() => {
                    onConfirm()
                    close()
                }}>Confirm</Button>
                <Button variant="secondary" onClick={() => {
                    onCancel()
                    close()
                }}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default function confirmModal(props: ConfirmModalProps) {
    const rootDiv = document.createElement('div'),
        root = createRoot(rootDiv)

    document.body.appendChild(rootDiv)

    root.render(<ConfirmModal {...props} />)
}
