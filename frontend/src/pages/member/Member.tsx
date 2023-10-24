import '../../assets/Accordion.scss'

import { Button } from 'react-bootstrap'
import MemberHeader from '../../components/MemberHeader'
import { PropsWithChildren, useContext, useState } from 'react'
import { MemberContext } from '../../contexts/MemberContext'
import confirmModal from '../../components/ConfirmModal'
import Signups from '../../components/Member/Signups'
import Subscriptions from '../../components/Member/Subscriptions'
import Payments from '../../components/Member/Payments'
import Profile from '../../components/Member/Profile'
import Licence from '../../components/Member/Licence'
import { membersApi } from '../../domain/members/provider'
import { notifyError, notifySuccess } from '../../utils/notifications'
import { useNavigate } from 'react-router'
import TakePayment from '../../components/Member/TakePayment'
import useCourses from '../../hooks/courses'

function FinalActions() {
    const [member, setMember] = useContext(MemberContext)
    const navigate = useNavigate()

    return member !== undefined && (
        <>
            {member.active ? (
                <Button type="submit" variant="warning" className="text-dark" onClick={() => {
                    confirmModal({
                        title: "Confirm Member Deactivation",
                        body: "This will hide the member from all attendance registers.",
                        onConfirm: () => membersApi.deactivate({ member })
                            .then(setMember)
                            .then(() => notifySuccess('Member deactivated'))
                            .catch(notifyError),
                    })
                }}>Deactivate Member</Button>) : (
                <Button type="submit" variant="success" className="text-light" onClick={() => {
                    confirmModal({
                        title: "Confirm Member Reactivation",
                        body: "This member will now reappear on all attendance registers.",
                        onConfirm: () => membersApi.activate({ member })
                            .then(setMember)
                            .then(() => notifySuccess('Member reactivated'))
                            .catch(notifyError)
                    })
                }}>Reactivate Member</Button>)}
            <Button type="submit" variant="danger" className="text-light" onClick={() => {
                confirmModal({
                    title: "Confirm Member Deletion",
                    body: "Are you sure? This will delete this member's record and all associated attendance records.",
                    onConfirm: () => membersApi.permanentlyDelete({ member })
                        .then(() => navigate('/members'))
                        .then(() => notifySuccess('Member deleted'))
                        .catch(notifyError)
                })
            }}>Delete Member</Button>
        </>
    )
}

function Expandable({ title, children }: PropsWithChildren & { title: string }) {
    const [open, setOpen] = useState<boolean>(false)

    return (
        <div className={`accordion bg-light rounded-3 p-3 pt-0 ${open ? 'open' : ''}`}>
            <div className="accordion-title pt-3" onClick={() => setOpen((open) => !open)}>
                <h2>{title}</h2>
            </div>
            <div className="accordion-content">
                <div className="pt-4">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default function Member() {
    const [paymentFormOpen, setPaymentFormOpen] = useState<boolean>(false)
    const courses = useCourses()
    const [member, _] = useContext(MemberContext)
    const memberCourses = courses.size === 0 || !member ? [] : [...courses.values()].filter((c) => member.isInCourse(c))

    if (member === undefined) {
        return <div className="loading" />
    }

    return (
        <>
            <MemberHeader />
            <div className="rounded-3 bg-white p-3 text-dark" id="copy">
                <div className="row gy-3">
                    <div className="col-md-8 order-md-1 order-2" id="memberDetails">
                        <div className="d-flex flex-column gap-3" id="memberLicence">
                            <Licence />
                            {memberCourses.length === 0 ? (
                                <>
                                    <div className="mb-0 alert alert-warning">
                                        <p>Member is not registered for any courses.</p>
                                        <p>Register a member for a course to take payments and create subscriptions.</p>
                                    </div>
                                    <Expandable title="Course registrations"><Signups /></Expandable>
                                </>
                            ) : (
                                <>
                                    <Expandable title="Course registrations"><Signups /></Expandable>
                                    <Expandable title="Active subscriptions"><Subscriptions /></Expandable>
                                    <Expandable title="Payments"><Payments /></Expandable>
                                </>
                            )}
                            <Expandable title="Profile"><Profile /></Expandable>
                            <div className="d-flex flex-column gap-3 d-md-none">
                                <FinalActions />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 order-md-2 order-1">
                        <div className="d-flex flex-column gap-3" id="memberActions">
                            <Button variant="primary" onClick={() => setPaymentFormOpen(true)}>Take Payment</Button>
                            <div className="d-none d-md-flex flex-column gap-3">
                                <FinalActions />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <TakePayment formOpen={paymentFormOpen} setFormOpen={setPaymentFormOpen} />
        </>
    )
}
