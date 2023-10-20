import { useContext, useEffect, useState } from 'react'
import useCourses from '../../hooks/courses'
import { MemberContext } from '../../contexts/MemberContext'
import { Member, Payment } from '../../domain/members/types'
import { Button } from 'react-bootstrap'
import { membersApi } from '../../domain/members/provider'
import TakePayment from './TakePayment'

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
                    {payments.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()).map(({ course, datetime }, index) => (
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

function PaymentsInner({ member }: { member: Member }) {
    const [historicalPayments, setHistoricalPayments] = useState<Payment[]>([])
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        membersApi.getPayments(member).then((payments) => {
            setHistoricalPayments(payments.filter((p) => p.used).slice(0, 5))
            setLoaded(true)
        })
    }, [])

    return (
        <div className={!loaded ? "loading" : ""}>
            <h3>Unused Payments</h3>
            {member.unusedPayments.length === 0 ? <p className="text-center">No unused payments</p> : <PaymentTable payments={member.unusedPayments} showNextSession={true} />}
            <h3>Historical Payments</h3>
            {historicalPayments.length === 0 ? <p className="text-center">No historical payments</p> : <PaymentTable payments={historicalPayments} />}
            <p className="fst-italic">Showing maximum last 5 payments.</p>
        </div>
    )
}

export default function Payments() {
    const courses = useCourses()
    const [member, _] = useContext(MemberContext)
    const [formOpen, setFormOpen] = useState<boolean>(false)
    const memberCourses = courses.size === 0 || !member ? [] : [...courses.values()].filter((c) => member.isInCourse(c))

    if (member === undefined) {
        return <div className="loading" />
    }

    return member && (
        <>
            <PaymentsInner member={member} />
            <div className="actions text-end">
                <Button variant="primary" onClick={() => { setFormOpen(true) }} disabled={memberCourses.length === 0}>Add Payment</Button>
            </div>
            <TakePayment formOpen={formOpen} setFormOpen={setFormOpen} />
        </>
    )
}
