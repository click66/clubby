import { Button, Modal } from 'react-bootstrap'
import MemberHeader from '../../components/MemberHeader'
import MemberTabs from '../../components/MemberTabs'
import { useContext, useState } from 'react'
import { Field, Form, Formik } from 'formik'
import { notifyError, notifySuccess } from '../../utils/notifications'
import { MemberContext } from '../../contexts/MemberContext'
import { addLicence } from '../../domain/members/members'
import { createApiInstance } from '../../utils/http'
import Cookies from 'universal-cookie'
import { Member } from '../../domain/members/types'

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
        <div className={`alert alert-${member.remainingTrialSessions === 0 ? 'danger' : 'warning'}`} role="alert">
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

    if (member.hasLicence()) {
        if (!member.isLicenceExpired(new Date())) {
            return <ActiveLicenceAlert />
        } else {
            return <ExpiredLicenceAlert />
        }
    } else if (member.activeTrial()) {
        return <TrialLicenceAlert />
    }
    return <TrialLicenceAlert />
}

function MemberLicence() {
    const cookies = new Cookies()
    const LEGACY_API_URL = import.meta.env.VITE_LEGACY_API_URL
    const httpMembers = createApiInstance(LEGACY_API_URL, cookies)


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
                centered
            >
                <Formik
                    initialValues={{
                        number: 0,
                        expiryDate: new Date((new Date().setFullYear(new Date().getFullYear() + 1))).toISOString().split('T')[0],
                    }}
                    onSubmit={(values, { setSubmitting }) => {
                        addLicence(httpMembers)({ member, licence: { ...values, expiryDate: new Date(values.expiryDate) } }).then(setMember).then(() => {
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
                                        <Field type="number" className="form-control" name="number" />
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
