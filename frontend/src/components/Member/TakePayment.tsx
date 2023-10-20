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
                        .then(() => {
                            notifySuccess('Payment recorded')
                        })
                        .catch(notifyError)
                        .finally(() => {
                            setSubmitting(false)
                            setFormOpen(false)
                        })
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Modal.Header>
                            <Modal.Title>Add Payment</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-3 row">
                                <div className="col-sm-12">
                                    <Field as="select" className="form-select" name="courseUuid">
                                        <option value="">Select course</option>
                                        {memberCourses.map((c) => (
                                            c ? <option key={c.uuid} value={c.uuid}>{c.label}</option> : ''
                                        ))}
                                    </Field>
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