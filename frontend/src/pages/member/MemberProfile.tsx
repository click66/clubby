import { Field, Form, Formik } from "formik"
import MemberHeader from "../../components/MemberHeader"
import MemberTabs from "../../components/MemberTabs"
import { Button } from "react-bootstrap"
import confirmModal from "../../components/ConfirmModal"
import { Link, useNavigate } from "react-router-dom"
import { addMemberToCourse, deleteMember, removeMemberFromCourse, updateMemberProfile } from "../../services/members"
import useCourses from "../../hooks/courses"
import { notifyError, notifySuccess } from "../../utils/notifications"
import { Member, PersistedMember } from "../../models/Member"
import { useContext, useState } from "react"
import { MemberContext } from "../../contexts/MemberContext"
import { Course, CourseCollection } from "../../models/Course"
import { Check, Plus, X } from "react-bootstrap-icons"

function SignUpForm({ close, courses, onSubmit }: { close: () => void, courses: Course[], onSubmit: (courseUuid: string) => void }) {
    return (
        <Formik
            initialValues={{
                courseUuid: courses[0].uuid ?? '',
            }}
            onSubmit={(values) => {
                onSubmit(values.courseUuid)
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

function SignedUpFor({ courses, doSignUp, member, undoSignUp }: { courses: CourseCollection, doSignUp: (courseUuid: string) => void, member: Member, undoSignUp: (courseUuid: string) => void }) {
    const [signUpFormOpen, setSignUpFormOpen] = useState(false)
    const eligibleCourses = [...courses.values()].filter((c) => !member.courseUuids.includes(c.uuid!))

    return (
        <>
            <h2>Signed Up For</h2>
            {
                member.courseUuids.length == 0 && !signUpFormOpen ? <p>Nothing (yet!)</p> : <ul>
                    {member.courseUuids.map((uuid) => courses.get(uuid)).map((c: Course | undefined) => c ? (
                        <li className="signedUpCourse" key={c.uuid}>
                            <Link to={`/attendance/${c.uuid}`}>{c.label}</Link>
                            <Button variant="danger" className="remove text-light" onClick={() => undoSignUp(c.uuid!)}><X /></Button>
                        </li>
                    ) : '')}
                </ul>
            }
            {
                signUpFormOpen ? <div className="pb-2">
                    <SignUpForm courses={eligibleCourses} onSubmit={(courseUuid: string) => {
                        doSignUp(courseUuid)
                        setSignUpFormOpen(false)
                    }} close={() => setSignUpFormOpen(false)} />
                </div> : ''
            }
            {
                !signUpFormOpen && eligibleCourses.length !== 0 ? <div className="registerActions">
                    <Button variant="primary" onClick={() => setSignUpFormOpen(true)}><Plus /></Button>
                </div> : ''
            }
        </>
    )
}

function MemberProfile() {
    const navigate = useNavigate()
    const [member, setMember] = useContext(MemberContext)
    const courses = useCourses()

    const doSignUp = (courseUuid: string) => {
        if (member) {
            setMember(new PersistedMember({ ...member, course_uuids: member.courseUuids.concat([courseUuid]) }))
            addMemberToCourse(member, { uuid: courseUuid }).then(() => {
                notifySuccess('Member has been signed up')
            }).catch(notifyError)
        }
    }

    const undoSignUp = (courseUuid: string) => {
        if (member) {
            setMember(new PersistedMember({ ...member, course_uuids: member.courseUuids.filter((uuid) => uuid !== courseUuid)}))
            removeMemberFromCourse(member, { uuid: courseUuid }).then(() => {
                notifySuccess('Member has been removed from course')
            }).catch(notifyError)
        }
    }

    return member ? (
        <>
            <MemberHeader />
            <div className="rounded-3 bg-white text-dark" id="copy">
                <MemberTabs selected="profile" />
                <div className="tab-content">
                    <div className="tab-pane fade p-3 active show" role="tabpanel">
                        <div className="row">
                            <div className="col-lg-9 col-sm-12">
                                <Formik initialValues={{
                                    action: 'save',
                                    name: member.name,
                                    dob: member.dateOfBirth ? member.dateOfBirth?.toISOString().split('T')[0] : '',
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
                                            updateMemberProfile(member.uuid!, values).then(() => {
                                                setMember(new PersistedMember({ ...member, profile: { ...values, dateOfBirth: new Date(values.dob) } }))
                                                notifySuccess("Member profile saved")
                                            })
                                            break
                                        case "delete":
                                            deleteMember(member).then(() => {
                                                notifySuccess("Member deleted")
                                                navigate("/members")
                                            })
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
                                                    <Field type="date" name="dob" className="form-control" />
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
                                            <div className="registerActions">
                                                <Button type="submit" disabled={isSubmitting} onClick={() => {
                                                    setFieldValue('action', 'save', false)
                                                    handleSubmit()
                                                }}>Save Member</Button>&nbsp;
                                                <Button type="submit" disabled={isSubmitting} variant="danger" className="text-light" onClick={() => {
                                                    confirmModal({
                                                        title: "Delete Member",
                                                        body: "Are you sure? This will delete this member's record and all associated attendance records",
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
                                <SignedUpFor courses={courses} member={member} doSignUp={doSignUp} undoSignUp={undoSignUp}/>
                            </div>
                        </div>
                    </div>
                </div >
            </div >
        </>
    ) : 'Loading'
}

export default MemberProfile
