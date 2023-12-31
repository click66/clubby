import '../../assets/MemberProfile.page.scss'

import { Field, Form, Formik } from 'formik'
import MemberHeader from '../../components/MemberHeader'
import MemberTabs from '../../components/MemberTabs'
import { Button } from 'react-bootstrap'
import confirmModal from '../../components/ConfirmModal'
import { Link, useNavigate } from 'react-router-dom'
import useCourses from '../../hooks/courses'
import { notifyError, notifySuccess } from '../../utils/notifications'
import { useContext, useState } from 'react'
import { MemberContext } from '../../contexts/MemberContext'
import { Check, Plus, X } from 'react-bootstrap-icons'
import EscapeLink from '../../components/EscapeLink'
import { Course, Member } from '../../domain/members/types'
import { membersApi } from '../../domain/members/provider'

function SignUpForm({ close, courses, onSubmit }: { close: () => void, courses: Course[], onSubmit: (course: Course) => void }) {
    return (
        <Formik
            initialValues={{
                courseUuid: courses[0].uuid ?? '',
            }}
            onSubmit={(values) => {
                const course = courses.find((c) => c.uuid === values.courseUuid)
                if (course) {
                    onSubmit(course)
                }
            }}
        >
            {({ isSubmitting }) => (
                <Form>
                    <div className="inlineForm">
                        <div className="field">
                            <Field as="select" name="courseUuid" className="form-select">
                                {courses.map((c) => (
                                    <option key={c.uuid} value={c.uuid}>{c.label}</option>
                                ))}
                            </Field>
                        </div>
                        <div className="controls">
                            <Button type="submit" variant="primary" disabled={isSubmitting}><Check /></Button>
                            <Button variant="danger" className="text-light" onClick={close}><X /></Button>
                        </div>
                    </div>
                </Form>
            )}
        </Formik>
    )
}

function SignedUpFor({ doSignUp, member, undoSignUp }: { doSignUp: (course: Course) => void, member: Member, undoSignUp: (course: Course) => void }) {
    const courses = useCourses()
    const [signUpFormOpen, setSignUpFormOpen] = useState(false)

    const memberCourses = member.courses
    const eligibleCourses = [...courses.values()].filter((c) => !member.isInCourse(c))

    return (
        <>
            <h2>Signed Up For</h2>
            {
                memberCourses.length == 0 && !signUpFormOpen ? <p>Nothing (yet!)</p> : <ul>
                    {memberCourses.map((course) => (
                        <li className="signedUpCourse pb-1" key={course.uuid}>
                            <Link to={`/attendance/${course.uuid}`}>{course.label}</Link>
                            <Button variant="danger" className="remove text-light" onClick={() => undoSignUp(course)}><X /></Button>
                        </li>
                    ))}
                </ul>
            }
            {
                signUpFormOpen ? <div className="pb-2">
                    <SignUpForm courses={eligibleCourses} onSubmit={(course: Course) => {
                        doSignUp(course)
                        setSignUpFormOpen(false)
                    }} close={() => setSignUpFormOpen(false)} />
                </div> : ''
            }
            <div className="actions">
                {
                    !signUpFormOpen && eligibleCourses.length !== 0 ?
                        <Button variant="primary" onClick={() => setSignUpFormOpen(true)}><Plus /></Button>
                        : ''
                }
            </div>
        </>
    )
}

function Subscriptions({ member }: { member: Member }) {
    return (
        <>
            <h2>Active Subscriptions</h2>
            {
                member.subscriptions.length === 0 ? <p>No active subscriptions</p> : <ul>
                    {member.subscriptions.map((subscription, index) => (
                        <li className="signedUpCourse pb-1" key={index}>
                            {subscription.course.label} (Until {subscription.expiryDate.toLocaleDateString()})
                        </li>
                    ))}
                </ul>
            }
        </>
    )
}

function MemberProfile() {
    const navigate = useNavigate()
    const [member, setMember] = useContext(MemberContext)

    if (member) {
        const doSignUp = (course: Course) => membersApi.signUpForCourse({ member, course }).then(setMember)
            .then(() => {
                notifySuccess('Member has been signed up for course.')
            })
            .catch(notifyError)

        const undoSignUp = (course: Course) => membersApi.removeFromCourse({ member, course }).then(setMember)
            .then(() => {
                notifySuccess('Member has been removed from course.')
            })
            .catch(notifyError)

        return (
            <>
                <MemberHeader />
                <div className="rounded-3 bg-white text-dark" id="copy">
                    <MemberTabs selected="profile" />
                    <div className="tab-content">
                        <div className="tab-pane fade p-3 active show" role="tabpanel">
                            <div className="memberProfile row">
                                <div className="memberProfileForm col-lg-9 col-sm-12">
                                    <Formik initialValues={{
                                        action: 'save',
                                        name: member.name,
                                        dateOfBirth: member.dateOfBirth ? member.dateOfBirth?.toISOString().split('T')[0] : '',
                                        phone: member.phone ?? '',
                                        email: member.email ?? '',
                                        address: member.address ?? '',
                                    }} onSubmit={(values, { setSubmitting }) => {
                                        switch (values.action) {
                                            case "save":
                                                if (Object.values(values).some(value => !value)) {
                                                    notifyError('All fields are required')
                                                    break
                                                }
                                                membersApi.updateProfile({ member, profile: { ...values, dateOfBirth: new Date(values.dateOfBirth) } })
                                                    .then(setMember)
                                                    .then(() => {
                                                        notifySuccess("Member profile saved")
                                                    })
                                                    .catch(notifyError)
                                                break
                                            case "deactivate":
                                                membersApi.deactivate({ member }).then(setMember).then(() => {
                                                    notifySuccess("Member has been deactivated")
                                                }).catch(notifyError)
                                                break
                                            case "activate":
                                                membersApi.activate({ member }).then(setMember).then(() => {
                                                    notifySuccess("Member has been activated")
                                                }).catch(notifyError)
                                                break
                                            case "delete":
                                                membersApi.permanentlyDelete({ member }).then(() => {
                                                    notifySuccess("Member deleted")
                                                    navigate("/members")
                                                }).catch(notifyError)
                                                break
                                        }
                                        setSubmitting(false)
                                    }}>
                                        {({ isSubmitting, setFieldValue, handleSubmit, setSubmitting }) => (
                                            <Form onSubmit={(e) => e.preventDefault()}>
                                                <div className="mb-3 row">
                                                    <label className="col-sm-2 col-form-label">Name</label>
                                                    <div className="col-sm-10">
                                                        <Field type="text" name="name" className="form-control" />
                                                    </div>
                                                </div>
                                                <div className="mb-3 row">
                                                    <label className="col-sm-2 col-form-label">Date of Birth</label>
                                                    <div className="col-sm-10">
                                                        <Field type="date" name="dateOfBirth" className="form-control" />
                                                    </div>
                                                </div>
                                                <div className="mb-3 row">
                                                    <label className="col-sm-2 col-form-label">Phone Number</label>
                                                    <div className="col-sm-4">
                                                        <Field type="text" name="phone" className="form-control" />
                                                    </div>
                                                    <label className="col-sm-2 col-form-label">Email address</label>
                                                    <div className="col-sm-4">
                                                        <Field type="text" name="email" className="form-control" />
                                                    </div>
                                                </div>
                                                <div className="mb-3 row">
                                                    <label className="col-sm-2 col-form-label">Address</label>
                                                    <div className="col-sm-10">
                                                        <Field component="textarea" name="address" rows="6" className="form-control" />
                                                    </div>
                                                </div>
                                                <div className="actions">
                                                    <Button type="submit" disabled={isSubmitting} onClick={() => {
                                                        setFieldValue('action', 'save', false)
                                                        handleSubmit()
                                                    }}>Save Member</Button>
                                                    {member.active ? (
                                                        <Button type="submit" disabled={isSubmitting} variant="warning" className="text-dark" onClick={() => {
                                                            confirmModal({
                                                                title: "Confirm Member Deactivation",
                                                                body: "This will hide the member from all attendance registers.",
                                                                onConfirm: () => {
                                                                    setFieldValue('action', 'deactivate', false)
                                                                    handleSubmit()
                                                                },
                                                                onCancel: () => {
                                                                    setSubmitting(false)
                                                                },
                                                            })
                                                        }}>Deactivate Member</Button>) : (
                                                        <Button type="submit" disabled={isSubmitting} variant="success" className="text-light" onClick={() => {
                                                            confirmModal({
                                                                title: "Confirm Member Reactivation",
                                                                body: "This member will now reappear on all attendance registers.",
                                                                onConfirm: () => {
                                                                    setFieldValue('action', 'activate', false)
                                                                    handleSubmit()
                                                                },
                                                                onCancel: () => {
                                                                    setSubmitting(false)
                                                                },
                                                            })
                                                        }}>Reactivate Member</Button>)}
                                                    <Button type="submit" disabled={isSubmitting} variant="danger" className="text-light" onClick={() => {
                                                        confirmModal({
                                                            title: "Confirm Member Deletion",
                                                            body: "Are you sure? This will delete this member's record and all associated attendance records.",
                                                            onConfirm: () => {
                                                                setFieldValue('action', 'delete', false)
                                                                handleSubmit()
                                                            },
                                                            onCancel: () => {
                                                                setSubmitting(false)
                                                            },
                                                        })
                                                    }}>Delete Member</Button>
                                                </div>
                                            </Form>
                                        )}
                                    </Formik>
                                </div>
                                <div className="col-lg-3 col-sm-12 mb-3">
                                    <div className="memberProfileCourses">
                                        <div className="pb-2">
                                            <SignedUpFor member={member} doSignUp={doSignUp} undoSignUp={undoSignUp} />
                                        </div>
                                        <div className="actions">
                                            <EscapeLink to="/courses">Manage Courses</EscapeLink>
                                        </div>
                                    </div>
                                    <div className="memberProfileCourses">
                                        <Subscriptions member={member} />
                                        <div className="actions">
                                            <EscapeLink to={`/members/${member.uuid}/payments`}>Manage Subscriptions</EscapeLink>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div >
                </div >
            </>
        )
    }

    return <div className="loading"></div>
}

export default MemberProfile
