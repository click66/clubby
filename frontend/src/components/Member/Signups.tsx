import { Button } from 'react-bootstrap'
import { Field, Form, Formik } from 'formik'
import { Check, X } from 'react-bootstrap-icons'
import { Course } from '../../domain/members/types'
import useCourses from '../../hooks/courses'
import { Link } from 'react-router-dom'
import { useContext, useState } from 'react'
import { MemberContext } from '../../contexts/MemberContext'
import { membersApi } from '../../domain/members/provider'
import { notifyError, notifySuccess } from '../../utils/notifications'

function SignupForm({ close, courses, onSubmit }: { close: () => void, courses: Course[], onSubmit: (course: Course) => void }) {
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

export default function Signups() {
    const [member, setMember] = useContext(MemberContext)
    const courses = useCourses()
    const [signUpFormOpen, setSignUpFormOpen] = useState(false)

    const memberCourses = member?.courses || []
    const eligibleCourses = [...courses.values()].filter((c) => member !== undefined && !member.isInCourse(c))

    if (member === undefined) {
        return <div className="loading" />
    }

    const doSignUp = (course: Course) => membersApi.signUpForCourse({ member, course }).then(setMember)
        .then(() => notifySuccess('Member has been signed up for course.'))
        .catch(notifyError)

    const undoSignUp = (course: Course) => membersApi.removeFromCourse({ member, course }).then(setMember)
        .then(() => notifySuccess('Member has been removed from course.'))
        .catch(notifyError)

    return (
        <>
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
                    <SignupForm courses={eligibleCourses} onSubmit={(course: Course) => {
                        doSignUp(course)
                        setSignUpFormOpen(false)
                    }} close={() => setSignUpFormOpen(false)} />
                </div> : ''
            }
            <div className="actions text-end">
                {
                    !signUpFormOpen && eligibleCourses.length !== 0 ?
                        <Button variant="primary" onClick={() => setSignUpFormOpen(true)}>Register</Button>
                        : ''
                }
            </div>
        </>
    )
}