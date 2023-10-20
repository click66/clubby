import { useContext, useEffect, useState } from 'react'
import { MemberContext } from '../../contexts/MemberContext'
import useCourses from '../../hooks/courses'
import { Button, Modal } from 'react-bootstrap'
import { Field, Form, Formik } from 'formik'
import { notifyError, notifySuccess } from '../../utils/notifications'
import { membersApi } from '../../domain/members/provider'
import { Course } from '../../domain/members/types'

function SubscriptionTable() {
    const [member, setMember] = useContext(MemberContext)
    const [loading, setLoading] = useState<boolean>(false)

    function doCancel(course: Course) {
        if (member) {
            setLoading(true)
            membersApi.cancelSubscription({ member, course })
                .then(setMember)
                .then(() => notifySuccess('Subscription cancelled'))
                .catch(notifyError)
                .finally(() => setLoading(false))
        }
    }

    return (
        <>
            <table className={`table ${loading || !member && 'loading'}`}>
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Expires</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {(member?.subscriptions || []).map(({ course, expiryDate }, index) => (
                        <tr key={index}>
                            <td>{course ? course.label : 'Any'}</td>
                            <td>{expiryDate.toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}</td>
                            <td className="actions text-end"><Button variant="danger" className="text-light" onClick={() => doCancel(course)}>Cancel</Button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}

export default function Subscriptions() {
    const [member, setMember] = useContext(MemberContext)
    const courses = useCourses()
    const [loaded, setLoaded] = useState<boolean>(false)
    const [formOpen, setFormOpen] = useState<boolean>(false)
    const memberCourses = courses.size === 0 || !member ? [] : [...courses.values()].filter((c) => member.isInCourse(c))

    useEffect(() => {
        setLoaded(true)
    }, [])

    return (
        <div className={(!loaded || !member) ? 'loading' : ''}>
            {(member?.subscriptions || []).length === 0 ? <p className="text-center">No active subscriptions</p> : <SubscriptionTable />}
            <div className="actions text-end">
                <Button variant="primary" disabled={(member?.courses || []).length === 0} onClick={() => setFormOpen(true)}>Add Subscription</Button>
            </div>
            <Modal show={formOpen} onHide={() => setFormOpen(false)} centered>
                <Formik
                    initialValues={{
                        courseUuid: '',
                        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                    }}
                    onSubmit={(values, { setSubmitting }) => {
                        const subscription = {
                            course: { uuid: values.courseUuid, label: courses.get(values.courseUuid)?.label } as { uuid: string, label?: string },
                            expiryDate: new Date(values.expiryDate),
                        }
                        if (member) {
                            membersApi.addSubscription({ member, subscription: { ...subscription, type: 'time' } })
                                .then(setMember)
                                .then(() => notifySuccess('Subscription created'))
                                .catch(notifyError)
                                .finally(() => {
                                    setSubmitting(false)
                                    setFormOpen(false)
                                })
                        }
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
                                        <Field as="select" required={true} className={`form-select ${errors.courseUuid && 'is-invalid'}`} name="courseUuid" validate={(value: string) => value === '' ? 'Please select a course' : null}>
                                            <option value=""></option>
                                            {memberCourses.map((c) => (
                                                c ? <option key={c.uuid} value={c.uuid}>{c.label}</option> : ''
                                            ))}
                                        </Field>
                                        {errors.courseUuid && <div className="invalid-feedback">{errors.courseUuid}</div>}
                                    </div>
                                </div>
                                <div className="mb-3 row">
                                    <label className="col-sm-4 col-form-label">Expiry Date</label>
                                    <div className="col-sm-8">
                                        <Field type="date" className="form-control" name="expiryDate" />
                                    </div>
                                </div>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button type="submit" variant="primary" disabled={isSubmitting}>Save Subscription</Button>
                            </Modal.Footer>
                        </Form>
                    )}
                </Formik>
            </Modal>
        </div>
    )
}