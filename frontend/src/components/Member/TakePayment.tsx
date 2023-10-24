import { Button, Modal } from 'react-bootstrap'
import { Field, Form, Formik } from 'formik'
import { notifyError, notifySuccess } from '../../utils/notifications'
import { useContext } from 'react'
import useCourses from '../../hooks/courses'
import { MemberContext } from '../../contexts/MemberContext'
import { membersApi } from '../../domain/members/provider'

export default function TakePayment({ formOpen, setFormOpen }: { formOpen: boolean, setFormOpen: (open: boolean) => void }) {
    const courses = useCourses()
    const [member, setMember] = useContext(MemberContext)
    const memberCourses = courses.size === 0 || !member ? [] : [...courses.values()].filter((c) => member.isInCourse(c))

    return member && (
        <Modal show={formOpen} onHide={() => setFormOpen(false)} centered>
            <Formik
                initialValues={{
                    courseUuid: memberCourses.length === 1 ? memberCourses[0]!.uuid : '',
                }}
                onSubmit={(values, { setSubmitting }) => {
                    if (!values.courseUuid) {
                        notifyError('Please select a course')
                        setSubmitting(false)
                        return
                    }

                    const payment = {
                        course: { uuid: values.courseUuid, label: courses.get(values.courseUuid)?.label } as { uuid: string, label?: string },
                        datetime: new Date(),
                        used: false,
                    }

                    membersApi.addPayment(member, payment.course)
                        .then(setMember)
                        .then(() => notifySuccess('Payment recorded'))
                        .catch(notifyError)
                        .finally(() => {
                            setSubmitting(false)
                            setFormOpen(false)
                        })
                }}
            >
                {({ errors, isSubmitting }) => (
                    <Form>
                        <Modal.Header>
                            <Modal.Title>Add Payment</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-3 row">
                                <label className="col-sm-4 col-form-label">Course</label>
                                <div className="col-sm-8">
                                    <Field as="select" className={`form-select ${errors.courseUuid && 'is-invalid'}`} name="courseUuid" validate={(value: string) => value === '' ? 'Please select a course' : null}>
                                        <option value=""></option>
                                        {memberCourses.map((c) => (
                                            c ? <option key={c.uuid} value={c.uuid}>{c.label}</option> : ''
                                        ))}
                                    </Field>
                                    {errors.courseUuid && <div className="invalid-feedback">{errors.courseUuid}</div>}
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button type="submit" variant="primary" disabled={isSubmitting}>Save Payment</Button>
                        </Modal.Footer>
                    </Form>
                )}
            </Formik>
        </Modal>
    )
}