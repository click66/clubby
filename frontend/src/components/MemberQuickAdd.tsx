import { Field, Form, Formik } from "formik"
import { Button, OverlayTrigger, Popover } from "react-bootstrap"
import { Course } from "../models/Course"
import { addMember } from "../services/members"
import { notifyError, notifySuccess } from "../utils/notifications"

interface MemberQuickAddProps {
    courses: Course[]
    onChange: () => void
}

interface MemberAndCourse {
    studentName: string
    product: string
}

function MemberQuickAddAndAssign({ courses, onChange }: MemberQuickAddProps) {
    const submitNewMember = (data: MemberAndCourse) => {
        addMember({ name: data.studentName }, { uuid: data.product }).then(() => {
            onChange()
            notifySuccess('New member added')
        }).catch(notifyError)
        document.body.click()
    }

    const firstCourse = courses.length ? courses[0] : undefined

    return (
        <Popover>
            <Popover.Body>
                <Formik
                    initialValues={{ product: firstCourse?.uuid ?? '', studentName: '' }}
                    onSubmit={submitNewMember}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <div className="mb-3 row">
                                <div className="col-sm-12">
                                    <Field type="text" className="form-control" name="studentName" placeholder="Name" />
                                </div>
                            </div>
                            {
                                courses.length > 0 ?
                                    <div className="mb-3 row">
                                        <div className="col-sm-12">
                                            <Field as="select" className="form-select" name="product">
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
        <OverlayTrigger trigger="click" placement="left" overlay={MemberQuickAddAndAssign(props)} rootClose>
            <Button variant="primary">New Member +</Button>
        </OverlayTrigger>
    )
}

export { MemberQuickAddAndAssign as MemberQuickAdd, MemberQuickAddButton }
