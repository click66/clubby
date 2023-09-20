import '../assets/Register.component.scss'
import Course from '../models/Course';
import Member from '../models/Member';
import { Button, Modal } from 'react-bootstrap';
import { Field, Form, Formik } from 'formik';

type Session = {
    courses: Course[],
    date: Date,
}

interface LogAttendanceModalProps {
    allowClearAttendance: boolean
    member: Member
    session: Session
    show: boolean
    close: () => void
    addAttendance: (member: Member, session: Session, { resolution, paymentOption }: { resolution: string, paymentOption: string }) => void
    removeAttendance: (member: Member, session: Session) => void
}

function LogAttendanceModal({ member, session, allowClearAttendance, show, close, removeAttendance, addAttendance }: LogAttendanceModalProps) {
    return (
        <Modal
            show={show}
            onHide={close}
        >
            <Formik
                initialValues={{
                    action: '',
                    resolution: 'attending',
                    paymentOption: session.courses.map((c) => member.hasUsablePaymentForCourse(c as { uuid: string })).includes(true) ? 'advance' : 'now',
                }}
                onSubmit={(values, { setSubmitting }) => {
                    if (member && session) {
                        switch (values.action) {
                            case 'confirm':
                                addAttendance(member, session, { resolution: values.resolution, paymentOption: values.paymentOption })
                                break
                            case 'clear':
                                removeAttendance(member, session)
                                break
                        }
                    }
                    setSubmitting(false)
                }}
            >
                {({ isSubmitting, setFieldValue, handleSubmit, values }) => (
                    <Form onSubmit={(e) => { e.preventDefault() }}>
                        <Modal.Header>
                            <Modal.Title>Log Attendance: <span className="text-secondary">{session?.courses[0].label}</span></Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-3 row">
                                <label className="col-sm-4 col-form-label">Student name</label>
                                <div className="col-sm-8">
                                    <input type="text" readOnly={true} className="form-control-plaintext" value={member?.name} />
                                </div>
                            </div>
                            <div className="mb-3 row">
                                <label className="col-sm-4 col-form-label">Session date</label>
                                <div className="col-sm-8">
                                    <input type="text" readOnly={true} className="form-control-plaintext" value={session?.date.toISOString().split('T')[0]} />
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

export default LogAttendanceModal