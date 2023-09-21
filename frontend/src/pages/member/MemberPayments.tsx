import { useContext, useEffect, useState } from "react"
import MemberHeader from "../../components/MemberHeader"
import { MemberContext } from "../../contexts/MemberContext"
import { addPayment, fetchPaymentsByMember } from "../../services/payments"
import useCourses from "../../hooks/courses"
import MemberTabs from "../../components/MemberTabs"
import { Course } from "../../models/Course"
import { Button, Modal } from "react-bootstrap"
import { Field, Form, Formik } from "formik"
import { notifyError, notifySuccess } from "../../utils/notifications"
import Spinner from "../../components/Spinner"

type Payment = {
    datetime: Date
    courseUuid: string
    used: boolean
}

type Member = {
    uuid: string
    courseUuids: string[]
}

function PaymentTable({ payments, showNextSession = false }: { payments: Payment[], showNextSession?: boolean }) {
    const courses = useCourses()

    return (
        <>
            <table className="table">
                <thead>
                    <tr>
                        <th>Payment Taken</th>
                        <th>For class</th>
                        {showNextSession ? <th>Next redeemable session</th> : ''}
                    </tr>
                </thead>
                <tbody>
                    {payments.map((p): [Payment, (Course | undefined)] => [p, courses.get(p.courseUuid)]).map(([p, c], index) => (
                        <tr key={index}>
                            <td>{p.datetime.toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}</td>
                            <td>{c ? c.label : 'Any'}</td>
                            {showNextSession ? <td></td> : ''}
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
        if (member.uuid !== undefined) {
            fetchPaymentsByMember(member).then((payments) => {
                setUnusedPayments(payments.filter((p) => !p.used))
                setHistoricalPayments(payments.filter((p) => p.used))
                setLoaded(true)
            })
        }
    }, [])

    const newAndUnusedPayments = newPayments.concat(unusedPayments)

    return !loaded ? <Spinner /> : (
        <>
            <h2>Unused Payments</h2>
            {newAndUnusedPayments.length === 0 ? <p className="text-center">No unused payments</p> : <PaymentTable payments={newAndUnusedPayments} showNextSession={true} />}
            {historicalPayments.length === 0 ? <p className="text-center">No historical payments</p> : <PaymentTable payments={historicalPayments} />}
        </>
    )
}

function ManagePayments({ member }: { member: Member }) {
    const courses = useCourses()
    const [formOpen, setFormOpen] = useState<boolean>(false)
    const [newPayments, setNewPayments] = useState<Payment[]>([])

    return member ? (
        <>
            <MemberHeader />
            <div className="rounded-3 bg-white text-dark" id="copy">
                <MemberTabs selected="payments" />
                <div className="p-3" id="tabCopyPayments" role="tabpanel" aria-labelledby="tabPayments">
                    <div className="row justify-content-center">
                        <div className="col-sm-12 col-md-10 col-lg-8">
                            <div className="mb-3 text-end">
                                <Button variant="primary" onClick={() => { setFormOpen(true) }}>Add Payment</Button>
                            </div>
                            <Payments member={member} newPayments={newPayments} />
                        </div>
                    </div>
                </div>
            </div>
            <Modal show={formOpen} onHide={() => setFormOpen(false)}>
                <Formik
                    initialValues={{
                        courseUuid: '',
                    }}
                    onSubmit={(values, { setSubmitting }) => {
                        if (!values.courseUuid) {
                            notifyError('Please select a course')
                            setSubmitting(false)
                            return
                        }
                        const payment = {
                            courseUuid: values.courseUuid,
                            datetime: new Date(),
                            used: false,
                        }

                        setNewPayments([payment].concat(newPayments))
                        addPayment({ ...payment, memberUuid: member.uuid }).then(() => {
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
                                            <option>Select course</option>
                                            {member.courseUuids.map((uuid: string): Course | undefined => courses.get(uuid)).map((c) => (
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

function MemberPayments() {
    const [member] = useContext(MemberContext)

    return member && member.uuid !== undefined ? <ManagePayments member={member as Member} /> : 'Loading'
}

export default MemberPayments
