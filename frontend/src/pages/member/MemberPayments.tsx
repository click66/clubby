import { useContext, useEffect, useState } from 'react'
import MemberHeader from '../../components/MemberHeader'
import { MemberContext } from '../../contexts/MemberContext'
import useCourses from '../../hooks/courses'
import MemberTabs from '../../components/MemberTabs'
import { Button, Modal } from 'react-bootstrap'
import { Field, Form, Formik } from 'formik'
import { notifyError, notifySuccess } from '../../utils/notifications'
import { membersApi } from '../../domain/members/provider'
import { Course, Member, Payment } from '../../domain/members/types'

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
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}</td>
                            <td className="text-end"><Button variant="danger" className="text-light" onClick={() => doCancel(course)}>Cancel</Button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}

function Subscriptions() {
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
            <div className="mb-3 text-end">
                <Button variant="primary" disabled={(member?.courses || []).length === 0} onClick={() => setFormOpen(true)}>Add Subscription</Button>
            </div>
            <h2>Active Subscriptions</h2>
            {(member?.subscriptions || []).length === 0 ? <p className="text-center">No active subscriptions</p> : <SubscriptionTable />}
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
                                <Button type="submit" variant="primary" disabled={isSubmitting}>Save Payment</Button>
                            </Modal.Footer>
                        </Form>
                    )}
                </Formik>
            </Modal>
        </div>
    )
}

function PaymentTable({ payments, showNextSession = false }: { payments: Payment[], showNextSession?: boolean }) {
    const courses = useCourses()

    return (
        <>
            <table className="table">
                <thead>
                    <tr>
                        <th>Payment Taken</th>
                        <th>Course</th>
                        {showNextSession ? <th>Next redeemable session</th> : ''}
                    </tr>
                </thead>
                <tbody>
                    {payments.map(({ course, datetime }, index) => (
                        <tr key={index}>
                            <td>{datetime.toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}</td>
                            <td>{course ? course.label : 'Any'}</td>
                            {showNextSession ? <td>{course && courses.has(course.uuid) ? courses.get(course.uuid)?.nextSession?.toLocaleDateString() : ''}</td> : ''}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}

function Payments({ member, newPayments }: { member: Member, newPayments: Payment[] }) {
    const [unusedPayments, setUnusedPayments] = useState<Payment[]>([])
    const [historicalPayments, setHistoricalPayments] = useState<Payment[]>([])
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        membersApi.getPayments(member).then((payments) => {
            setUnusedPayments(payments.filter((p) => !p.used))
            setHistoricalPayments(payments.filter((p) => p.used).slice(0, 5))
            setLoaded(true)
        })
    }, [])

    const newAndUnusedPayments = newPayments.concat(unusedPayments)

    return (
        <div className={!loaded ? "loading" : ""}>
            <h2>Unused Payments</h2>
            {newAndUnusedPayments.length === 0 ? <p className="text-center">No unused payments</p> : <PaymentTable payments={newAndUnusedPayments} showNextSession={true} />}
            <h2>Historical Payments</h2>
            {historicalPayments.length === 0 ? <p className="text-center">No historical payments</p> : <PaymentTable payments={historicalPayments} />}
            <p className="fst-italic">Showing maximum last 5 payments.</p>
        </div>
    )
}

function MemberPayments() {
    const courses = useCourses()
    const [member] = useContext(MemberContext)
    const [formOpen, setFormOpen] = useState<boolean>(false)
    const [newPayments, setNewPayments] = useState<Payment[]>([])
    const memberCourses = courses.size === 0 || !member ? [] : [...courses.values()].filter((c) => member.isInCourse(c))

    return member ? (
        <>
            <MemberHeader />
            <div className="rounded-3 bg-white text-dark" id="copy">
                <MemberTabs selected="payments" />
                <div className="tab-content" id="tabCopyPayments" role="tabpanel" aria-labelledby="tabPayments">
                    <div className="p-3">
                        <div className="row justify-content-center">
                            <div className="col-sm-12 col-md-10 col-lg-8">
                                <div className="mb-3 text-end">
                                    <Button variant="primary" onClick={() => { setFormOpen(true) }} disabled={memberCourses.length === 0}>Add Payment</Button>
                                </div>
                                <Payments member={member} newPayments={newPayments} />
                            </div>
                            <div className="hbar"></div>
                            <div className="col-sm-12 col-md-10 col-lg-8 mt-2">
                                <Subscriptions />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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

                        setNewPayments([payment].concat(newPayments))
                        membersApi.addPayment(member, payment.course).then(() => {
                            notifySuccess('Payment recorded')
                        }).catch(notifyError)
                        setSubmitting(false)
                        setFormOpen(false)
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
        </>
    ) : 'Loading'
}

export default MemberPayments
