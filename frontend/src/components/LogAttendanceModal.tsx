import '../assets/Register.component.scss'
import { Button, Modal } from 'react-bootstrap'
import { Field, Form, Formik } from 'formik'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { Attendee } from '../domain/attendance/types'

interface Course {
    uuid: string
    label: string
}

type Session = {
    courses: Course[],
    date: Date,
}

interface LogAttendanceModalProps {
    allowClearAttendance: boolean
    attendee: Attendee
    session: Session
    addAttendance: ({ attendee, session, resolution, paymentOption }: { attendee: Attendee, session: Session, resolution: 'paid' | 'comp' | null, paymentOption: 'advance' | 'now' | 'subscription' }) => void
    removeAttendance: ({ attendee, session }: { attendee: Attendee, session: Session }) => void,
}

function LogAttendanceModal({ attendee, session, allowClearAttendance, removeAttendance, addAttendance }: LogAttendanceModalProps) {
    const [show, setShow] = useState<boolean>(true)

    const close = () => {
        setShow(false)
    }

    const hasPayment = session.courses.map((c) => attendee.hasUsablePaymentForCourse(c)).includes(true)
    const hasSubscription = session.courses.map((c) => attendee.hasSubscriptionForCourse(c, new Date())).includes(true)
    let defaultPaymentOption = 'now'

    if (hasPayment) {
        defaultPaymentOption = 'advance'
    }

    if (hasSubscription) {
        defaultPaymentOption = 'subscription'
    }

    return (
        <Modal
            show={show}
            onHide={close}
            centered
        >
            <Formik
                initialValues={{
                    action: '',
                    resolution: 'attending',
                    paymentOption: defaultPaymentOption,
                }}
                onSubmit={(values, { setSubmitting }) => {
                    if (attendee && session) {
                        switch (values.action) {
                            case 'confirm':
                                addAttendance({
                                    attendee,
                                    session,
                                    resolution: values.resolution === 'paid' || values.resolution === 'comp' ? values.resolution : null,
                                    paymentOption: values.paymentOption === 'advance' ? 'advance' : values.paymentOption === 'subscription' ? 'subscription' : 'now',
                                })
                                break
                            case 'clear':
                                removeAttendance({ attendee, session })
                                break
                        }
                    }
                    setSubmitting(false)
                    close()
                }}
            >
                {({ isSubmitting, setFieldValue, handleSubmit, values }) => (
                    <Form onSubmit={(e) => { e.preventDefault() }}>
                        <Modal.Header>
                            {/* TODO This should show the names of all applicable courses */}
                            <Modal.Title>Log Attendance: <span className="text-secondary">{session.courses[0].label}</span></Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-3 row">
                                <label className="col-sm-4 col-form-label">Student name</label>
                                <div className="col-sm-8">
                                    <input type="text" readOnly={true} className="form-control-plaintext" value={attendee.name} />
                                </div>
                            </div>
                            <div className="mb-3 row">
                                <label className="col-sm-4 col-form-label">Session date</label>
                                <div className="col-sm-8">
                                    <input type="text" readOnly={true} className="form-control-plaintext" value={session.date.toISOString().split('T')[0]} />
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="form-check">
                                    <Field id="resolutionAttending" className="form-check-input" type="radio" name="resolution" value="attending" />
                                    <label htmlFor="resolutionAttending" className="form-check-label">Not Paid</label>
                                </div>
                                <div className="form-check">
                                    <Field id="resolutionComp" className="form-check-input" type="radio" name="resolution" value="comp" />
                                    <label htmlFor="resolutionComp" className="form-check-label">Complementary</label>
                                </div>
                                <div className="form-check">
                                    <Field id="resolutionPaid" className="form-check-input" type="radio" name="resolution" value="paid" />
                                    <label htmlFor="resolutionPaid" className="form-check-label">Paid</label>
                                </div>
                                {
                                    values.resolution == 'paid' ?
                                        <div className="mt-3 form-floating">
                                            <Field as="select" className="form-select" name="paymentOption">
                                                <option value="advance">Advance Payment</option>
                                                <option value="subscription">Subscription</option>
                                                <option value="now">New Payment</option>
                                            </Field>
                                            <label>Pay using...</label>
                                        </div> : ''
                                }
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button type="submit" variant="primary" disabled={isSubmitting} onClick={() => {
                                setFieldValue('action', 'confirm', false)
                                handleSubmit()
                            }}>Confirm</Button>
                            <Button type="submit" variant="primary" disabled={isSubmitting || !allowClearAttendance} onClick={() => {
                                setFieldValue('action', 'clear', false)
                                handleSubmit()
                            }}>Clear</Button>
                            <Button variant="secondary" onClick={close}>Cancel</Button>
                        </Modal.Footer>
                    </Form>
                )}
            </Formik>
        </Modal >
    )
}

function renderLogAttendanceModal(target: Node, props: LogAttendanceModalProps) {
    const rootDiv = document.createElement('div'),
        root = createRoot(rootDiv)

    target.appendChild(rootDiv)
    root.render(<LogAttendanceModal {...props} />)
}

export { LogAttendanceModal, renderLogAttendanceModal }
