import { ErrorMessage, Field, Form, Formik } from 'formik'
import { useContext } from 'react'
import { MemberContext } from '../../contexts/MemberContext'
import * as Yup from 'yup'
import { Button } from 'react-bootstrap'
import { membersApi } from '../../domain/members/provider'
import { notifyError, notifySuccess } from '../../utils/notifications'

const memberSchema = Yup.object().shape({
    name: Yup.string().required('Name cannot be blank'),
    email: Yup.string().required('Email cannot be blank'),
    dateOfBirth: Yup.date().nullable(),
    phone: Yup.string().nullable(),
    address: Yup.string().nullable(),
})

export default function Profile() {
    const [member, setMember] = useContext(MemberContext)

    if (member === undefined) {
        return <div className="loading" />
    }

    return (
        <Formik
            initialValues={{
                name: member.name,
                email: member.email || '',
                phone: member.phone || '',
                dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString().split('T')[0] : undefined,
                address: member.address || '',
            }}
            onSubmit={(values, { setSubmitting }) => {
                membersApi.updateProfile({
                    member, profile: {
                        ...values,
                        dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth) : null,
                    }
                })
                    .then(setMember)
                    .then(() => notifySuccess('Member profile saved'))
                    .catch(notifyError)
                    .finally(() => setSubmitting(false))
            }}
            validationSchema={memberSchema}
        >
            {({ dirty, errors, isSubmitting }) => (
                <Form className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label" htmlFor="name">Name</label>
                        <Field className={`form-control ${errors.name && 'is-invalid'}`} name="name" id="name" />
                        <ErrorMessage name="name" component="div" className="error invalid-feedback" />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label" htmlFor="email">Email</label>
                        <Field className={`form-control ${errors.email && 'is-invalid'}`} name="email" id="email" />
                        <ErrorMessage name="email" component="div" className="error invalid-feedback" />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label" htmlFor="phone">Phone</label>
                        <Field className={`form-control ${errors.phone && 'is-invalid'}`} name="phone" id="phoneNumber" />
                        <ErrorMessage name="phone" component="div" className="error invalid-feedback" />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label" htmlFor="dateOfBirth">Date of Birth</label>
                        <Field className={`form-control ${errors.dateOfBirth && 'is-invalid'}`} name="dateOfBirth" id="dateOfBirth" type="date" />
                        <ErrorMessage name="dateOfBirth" component="div" className="error invalid-feedback" />
                    </div>
                    <div className="col-md-12">
                        <label className="form-label" htmlFor="address">Address</label>
                        <Field as="textarea" className={`form-control ${errors.address && 'is-invalid'}`} name="address" id="address" />
                        <ErrorMessage name="address" component="div" className="error invalid-feedback" />
                    </div>
                    <div className="actions text-end">
                        <Button variant="primary" type="submit" disabled={!dirty || isSubmitting}>Save Changes</Button>
                    </div>
                </Form>
            )}
        </Formik>
    )
}
