import { Field, Form, Formik } from 'formik'
import { Button, OverlayTrigger, Popover } from 'react-bootstrap'
import { notifyError, notifySuccess } from '../utils/notifications'
import { Member } from '../domain/members/types'
import { membersApi } from '../domain/members/provider'
import { PersonPlusFill } from 'react-bootstrap-icons'
import Select from 'react-select/async-creatable'
import { useState } from 'react'

interface Course {
    uuid: string
    label: string
}

interface MemberQuickSignupProps {
    courses: Course[]
    onChange: (newMember: Member) => void
}

function MemberSelect({ onSelectedChange }: { onSelectedChange: (value: Member | string | undefined, isNew: boolean) => void }) {
    return (
        <Select name="member" placeholder="Name" isClearable={true} loadOptions={(val) => membersApi.getMembersLikeName({ searchString: val })
            .then((members) => members.map((m) => ({
                value: m,
                label: m.name,
                __isNew__: false,
            })))} onChange={(selected) => onSelectedChange(selected?.value, selected?.__isNew__ || false)
            } />
    )
}

function MemberQuickSignup({ courses, onChange }: MemberQuickSignupProps) {
    const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined)
    const [newMember, setNewMember] = useState<string | undefined>(undefined)

    const submitNewMember = (data: { productUuid: string }, { setSubmitting }: { setSubmitting: (submitting: boolean) => void}) => {
        const selectedCourse = courses.find((c) => c.uuid === data.productUuid)
        if (!selectedCourse) {
            notifyError('Please select a course')
        } else {
            if (newMember) {
                membersApi.createMember({ name: newMember, course: selectedCourse })
                    .then(onChange)
                    .then(() => setNewMember(undefined))
                    .then(() => notifySuccess('Member created and signed up successfully'))
                    .catch(notifyError)
                    .finally(() => { document.body.click() })
            } else if (selectedMember) {
                membersApi.signUpForCourse({ member: selectedMember, course: selectedCourse })
                    .then(onChange)
                    .then(() => setSelectedMember(undefined))
                    .then(() => notifySuccess('Member signed up successfully'))
                    .catch(notifyError)
                    .finally(() => { document.body.click() })
            } else {
                setSubmitting(false)
            }
        }
    }

    const firstCourse = courses.length ? courses[0] : undefined

    return (
        <Popover className="memberPopover">
            <Popover.Body>
                <Formik
                    initialValues={{ productUuid: firstCourse?.uuid ?? '' }}
                    onSubmit={submitNewMember}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <div className="mb-3 row">
                                <div className="col-sm-12">
                                    <MemberSelect onSelectedChange={(value, isNew) => {
                                        setSelectedMember(isNew ? undefined : value as Member)
                                        setNewMember(isNew ? value as string : undefined)
                                    }} />
                                </div>
                            </div>
                            {
                                courses.length > 0 ?
                                    <div className="mb-3 row">
                                        <div className="col-sm-12">
                                            <Field as="select" disabled={courses.length === 1} className="form-select" name="productUuid">
                                                {courses.map((c: Course) => (
                                                    <option key={c.uuid} value={c.uuid}>{c.label}</option>
                                                ))}
                                            </Field>
                                        </div>
                                    </div> : ''
                            }
                            <div className="col-auto">
                                <Button type="submit" variant="primary" disabled={isSubmitting}>Confirm</Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </Popover.Body>
        </Popover>
    )
}

function MemberQuickSignupButton(props: MemberQuickSignupProps) {
    return (
        <OverlayTrigger trigger="click" placement="bottom" overlay={MemberQuickSignup(props)} rootClose>
            <Button variant="primary"><span className="btn-text">New/Add Member</span> <PersonPlusFill /></Button>
        </OverlayTrigger>
    )
}

export { MemberQuickSignup, MemberQuickSignupButton }
