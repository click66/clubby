import { useContext, useState } from 'react'
import { MemberContext } from '../../contexts/MemberContext'
import { Button, Modal } from 'react-bootstrap'
import { Field, Form, Formik } from 'formik'
import { membersApi } from '../../domain/members/provider'
import { notifyError, notifySuccess } from '../../utils/notifications'

export default function Licence() {
    const [member, setMember] = useContext(MemberContext)
    const [licenceFormOpen, setLicenceFormOpen] = useState<boolean>(false)
    const openForm = () => setLicenceFormOpen(true)

    if (member === undefined) {
        return ''
    }

    const ActiveLicenceAlert = () => (
        <div className="mb-0 alert alert-success" role="alert">
            <p>Member is fully licenced.</p>
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
        <div className={`mb-0 alert alert-${member.remainingTrialSessions === 0 ? 'danger' : 'warning'}`} role="alert">
            <p>Member is not licenced.</p>
            <p>Member has {member.remainingTrialSessions} trial session(s) remaining.</p>
            <div className="pt-2">
                <Button onClick={openForm}>Create Licence</Button>
            </div>
        </div>
    )
    const ExpiredLicenceAlert = () => (
        <div className="mb-0 alert alert-danger" role="alert">
            <p>Member licence expired on {member.licenceExpiry!.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
            <div className="pt-2">
                <Button onClick={openForm}>Renew Licence</Button>
            </div>
        </div>
    )

    const alert = () => {
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

    return (
        <>
            {alert()}
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
                        membersApi.addLicence({ member, licence: { ...values, expiryDate: new Date(values.expiryDate) } })
                            .then(setMember)
                            .then(() => {
                                setSubmitting(false)
                                notifySuccess('Member licence updated')
                            })
                            .catch(notifyError)
                            .finally(() => setLicenceFormOpen(false))
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
    )
}