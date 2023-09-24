import '../assets/Register.component.scss'
import { Member } from '../models/Member'
import { Button, Modal } from 'react-bootstrap'
import { Field, Form, Formik } from 'formik'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'

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
    member: Member
    session: Session
    addAttendance: ({ member, session, resolution, paymentOption }: { member: Member, session: Session, resolution: string, paymentOption: string }) => void
    removeAttendance: ({ member, session }: { member: Member, session: Session }) => void,
}

function LogAttendanceModal({ member, session, allowClearAttendance, removeAttendance, addAttendance }: LogAttendanceModalProps) {
    const [show, setShow] = useState<boolean>(true)

    const close = () => {
        setShow(false)
    }

    return (
        <Modal
            show={show}
            onHide={close}
        >
            <Formik
                initialValues={{
                    action: '',
                    resolution: 'attending',
                    paymentOption: session.courses.map((c) => member.hasUsablePaymentForCourse(c)).includes(true) ? 'advance' : 'now',
                }}
                onSubmit={(values, { setSubmitting }) => {
                    if (member && session) {
                        switch (values.action) {
                            case 'confirm':
                                addAttendance({ member, session, resolution: values.resolution, paymentOption: values.paymentOption })
                                break
                            case 'clear':
                                removeAttendance({ member, session })
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
                                    <input type="text" readOnly={true} className="form-control-plaintext" value={member.name} />
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
