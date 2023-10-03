import { Field, Form, Formik } from 'formik'
import { Button, OverlayTrigger, Popover } from 'react-bootstrap'
import { notifyError, notifySuccess } from '../utils/notifications'
import { Member } from '../domain/members/types'
import { membersApi } from '../domain/members/provider'

interface Course {
    uuid: string
    label: string
}

interface MemberQuickAddProps {
    courses: Course[]
    onChange: (newMember: Member) => void
}

interface MemberAndCourse {
    name: string
    productUuid: string
}

function MemberQuickAddAndAssign({ courses, onChange }: MemberQuickAddProps) {
    const submitNewMember = (data: MemberAndCourse) => {
        membersApi.createMember({
            name: data.name,
            course: { uuid: data.productUuid, }
        }).then((member) => {
            onChange(member)
            notifySuccess('New member added')
        }).catch(notifyError)
        document.body.click()
    }

    const firstCourse = courses.length ? courses[0] : undefined

    return (
        <Popover>
            <Popover.Body>
                <Formik
                    initialValues={{ productUuid: firstCourse?.uuid ?? '', name: '' }}
                    onSubmit={submitNewMember}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <div className="mb-3 row">
                                <div className="col-sm-12">
                                    <Field type="text" autoFocus className="form-control" name="name" placeholder="Name" />
                                </div>
                            </div>
                            {
                                courses.length > 0 ?
                                    <div className="mb-3 row">
                                        <div className="col-sm-12">
                                            <Field as="select" className="form-select" name="productUuid">
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

function MemberQuickAddButton(props: MemberQuickAddProps) {
    return (
        <OverlayTrigger trigger="click" placement="bottom" overlay={MemberQuickAddAndAssign(props)} rootClose>
            <Button variant="primary"><span className="btn-text">New Member</span> +</Button>
        </OverlayTrigger>
    )
}

export { MemberQuickAddAndAssign as MemberQuickAdd, MemberQuickAddButton }
