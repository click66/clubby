import { Button, Modal } from "react-bootstrap"
import MemberHeader from "../../components/MemberHeader"
import Member from "../../models/Member"
import MemberTabs from "../../components/MemberTabs"
import { useContext, useState } from "react"
import { Field, Form, Formik } from "formik"
import { addMemberLicence } from "../../services/members"
import { notifyError, notifySuccess } from "../../utils/notifications"
import { MemberContext } from "../../contexts/MemberContext"

function MemberLicenceAlert({ member, openForm }: { member: Member, openForm: () => void }) {
    const ActiveLicenceAlert = () => (
        <div className="alert alert-success" role="alert">
            <p>Student is fully licenced.</p>
            <ul className="mb-0">
                <li>Licence number: {member.licenceNo}</li>
                <li>Expires on: {member.licenceExpiry!.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</li>
            </ul>
            <div className="pt-2">
                <Button onClick={openForm}>Update Licence</Button>
            </div>
        </div>
    )

    const TrialLicenceAlert = () => (
        <div className="alert alert-warning" role="alert">
            <p>Student is not licenced.</p>
            <p>Student has {member.remainingTrialSessions} trial session(s) remaining.</p>
            <div className="pt-2">
                <Button onClick={openForm}>Create Licence</Button>
            </div>
        </div>
    )
    const ExpiredLicenceAlert = () => (
        <div className="alert alert-danger" role="alert">
            <p>Student licence expired on {member.licenceExpiry!.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
            <div className="pt-2">
                <Button onClick={openForm}>Renew Licence</Button>
            </div>
        </div>
    )
    console.log(member)
    if (member.hasLicence()) {
        if (!member.expired(new Date())) {
            return <ActiveLicenceAlert />;
        } else {
            return <ExpiredLicenceAlert />;
        }
    } else if (member.activeTrial()) {
        return <TrialLicenceAlert />;
    }
    return <ExpiredLicenceAlert />;
}

function MemberLicence() {
    const [licenceFormOpen, setLicenceFormOpen] = useState(false)
    const [member, setMember] = useContext(MemberContext)

    return member ? (
        <>
            <MemberHeader />
            <div className="rounded-3 bg-white text-dark" id="copy">
                <MemberTabs selected="licence" />
                <div className="tab-content">
                    <div className="tab-pane fade p-3 active show" id="tabCopyLicence" role="tabpanel" aria-labelledby="tabLicence">
                        <div className="row justify-content-center">
                            <div className="col-sm-12 col-md-10 col-lg-8">
                                <MemberLicenceAlert openForm={() => { setLicenceFormOpen(true) }} member={member} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                show={licenceFormOpen}
                onHide={() => { setLicenceFormOpen(false) }}
            >
                <Formik
                    initialValues={{
                        licenceNo: 0,
                        expiryDate: new Date((new Date().setFullYear(new Date().getFullYear() + 1))).toISOString().split('T')[0],
                    }}
                    onSubmit={(values, { setSubmitting }) => {
                        addMemberLicence(member.uuid!, { ...values, expiryDate: new Date(values.expiryDate) }).then(() => {
                            setMember(new Member({ ...member, membership: { ...member.membership, licence: { idNumber: values.licenceNo, expires: new Date(values.expiryDate) } } }))
                            setSubmitting(false)
                            notifySuccess('Member licence updated')
                        }).catch(notifyError)
                        setLicenceFormOpen(false)
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <Modal.Header>
                                <Modal.Title>Update Licence</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="mb-3 row">
                                    <label className="col-sm-4 col-form-label">Licence Number</label>
                                    <div className="col-sm-8">
                                        <Field type="number" className="form-control" name="licenceNo" />
                                    </div>
                                </div>
                                <div className="mb-3 row">
                                    <label className="col-sm-4 col-form-label">Expiry Date</label>
                                    <div className="col-sm-8">
                                        <Field type="date" className="form-control" name="expiryDate" />
                                    </div>
                                </div>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button type="submit" variant="primary" disabled={isSubmitting}>Save Licence</Button>
                            </Modal.Footer>
                        </Form>
                    )}
                </Formik>
            </Modal>
        </>
    ) : 'Loading'
}

export default MemberLicence
