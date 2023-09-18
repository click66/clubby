import { Field, Form, Formik } from "formik"
import MemberHeader from "../../components/MemberHeader"
import MemberTabs from "../../components/MemberTabs"
import useMember from "../../hooks/member"
import { Button } from "react-bootstrap"
import confirmModal from "../../components/ConfirmModal"
import { Link, useNavigate } from "react-router-dom"
import { deleteMember, updateMemberProfile } from "../../services/members"
import useCourses from "../../hooks/courses"
import { notifyError, notifySuccess } from "../../utils/notifications"
import Member from "../../models/Member"

function MemberProfile() {
    const navigate = useNavigate()
    const [member, setMember] = useMember()
    const courses = useCourses()

    return member ? (
        <>
            <MemberHeader member={member} />
            <div className="rounded-3 bg-white text-dark" id="copy">
                <MemberTabs selected="profile" />
                <div className="tab-content">
                    <div className="tab-pane fade p-3 active show" role="tabpanel">
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
                                        setMember(new Member({ ...member, profile: { ...values, dateOfBirth: new Date(values.dob) } }))
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
                                    <div className="row">
                                        <div className="col-lg-9 col-sm-12">
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
                                        </div>
                                        <div className="col-lg-3 col-sm-12 mb-3">
                                            <h2>Signed Up For</h2>
                                            <ul>
                                                {courses.filter((c) => c.uuid != undefined && member.courseUuids.includes(c.uuid)).map((c) => (
                                                    <li key={c.uuid}><Link to={`/attendance/${c.uuid}`}>{c.label}</Link></li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="p-3 registerActions">
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
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            </div>
        </>
    ) : 'Loading'
}

export default MemberProfile
