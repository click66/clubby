import '../assets/Settings.page.scss'

import { ErrorMessage, Field, Form, Formik } from 'formik'
import { Button } from 'react-bootstrap'
import { authentication } from '../domain/authentication/authentication'
import { notifyError, notifySuccess } from '../utils/notifications'

function ChangePassword() {
    const validateConfirmPassword = (proposed: string, confirm: string) => {
        if (proposed !== confirm) return 'New passwords do not match'
    }

    return (
        <>

            <h1>Password</h1>
            <p>Change your password.</p>
            <Formik
                initialValues={{
                    'existingPassword': '',
                    'newPassword': '',
                    'confirmNewPassword': '',
                }}
                onSubmit={(values, { resetForm, setSubmitting }) => {
                    authentication.changePassword(values)
                        .then(() => {
                            notifySuccess('Your password has been changed')
                            resetForm()
                        })
                        .catch(notifyError)
                        .finally(() => setSubmitting(false))
                }}
            >
                {({ isSubmitting, values }) => (
                    <Form>
                        <div className="mb-3 form-group">
                            <label className="col-form-label" htmlFor="existingPassword">Current password</label>
                            <Field className="form-control" id="existingPassword" name="existingPassword" type="password" validate={(value: string) => value === '' ? 'Required' : null} />
                            <ErrorMessage name="existingPassword" component="div" className="form-text text-danger" />
                            <p className="form-text text-light">Provide your current password in order to change it.</p>
                        </div>
                        <div className="mb-3 form-group">
                            <label className="col-form-label" htmlFor="newPassword">New password</label>
                            <Field className="form-control" id="newPassword" name="newPassword" type="password" validate={(value: string) => value === '' ? 'Required' : null} />
                            <ErrorMessage name="newPassword" component="div" className="form-text text-danger" />
                        </div>
                        <div className="mb-3 form-group">
                            <label className="col-form-label" htmlFor="confirmNewPassword">Confirm new password</label>
                            <Field className="form-control" id="confirmNewPassword" name="confirmNewPassword" type="password" validate={(value: string) => validateConfirmPassword(values.newPassword, value)} />
                            <ErrorMessage name="confirmNewPassword" component="div" className="form-text text-danger" />
                        </div>
                        <div className="form-group">
                            <Button type="submit" variant="primary" className="text-dark bg-light" disabled={isSubmitting}>Change Password</Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    )
}

export default function User() {
    return (
        <div id="copy">
            <div className="settingsContainer">
                <ChangePassword />
            </div>
        </div>
    )
}
