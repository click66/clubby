import { ErrorMessage, Field, Form, Formik } from 'formik'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authentication } from '../../authentication'
import Danger from '../../components/Alerts/Danger'

const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN

function validateConfirmPassword(proposed: string, confirm: string) {
    if (proposed !== confirm) return 'New passwords do not match'
}

export default function Register() {
    const [submitted, setSubmitted] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)

    if (submitted) {
        return (
            <>
                <div className="justify-center">
                    <h2 className="text-2xl font-semibold mb-6 text-center">Registration Successful!</h2>
                    <p>Check your email for account activation instructions.</p>
                </div>
            </>
        )
    }

    return (
        <>
            {error !== null ? <Danger title="Registration Failed">{error.message}</Danger> : ''}
            <div className="flex items-center justify-center">
                <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                    <h2 className="text-2xl font-semibold mb-6 text-center">Register</h2>

                    <Formik
                        initialValues={{
                            'email': '',
                            'password': '',
                            'confirmPassword': '',
                        }}
                        onSubmit={(values, { setSubmitting }) => {
                            authentication.register(APP_DOMAIN, values).then(() => {
                                setSubmitted(true)
                                setSubmitting(false)
                            }).catch(setError).finally(() => { setSubmitting(false) })
                        }}
                    >
                        {({ isSubmitting, values }) => (
                            <Form>
                                <div className="mb-4">
                                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                                        Email
                                    </label>
                                    <Field
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-text-primary"
                                        validate={(value: string) => value === '' ? 'Required' : null}
                                        required
                                    />
                                    <ErrorMessage name="email" component="div" className="form-text text-error text-xs italic pt-1" />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                                        Password
                                    </label>
                                    <Field
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-text-primary"
                                        validate={(value: string) => value === '' ? 'Required' : null}
                                        required
                                    />
                                    <ErrorMessage name="password" component="div" className="form-text text-error text-xs italic pt-1" />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                                        Confirm Password
                                    </label>
                                    <Field
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-text-primary"
                                        required
                                        validate={(value: string) => validateConfirmPassword(values.password, value)}
                                    />
                                    <ErrorMessage name="confirmPassword" component="div" className="form-text text-error text-xs italic pt-1" />
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="disabled:opacity-50 w-full bg-primary text-white p-3 rounded-md focus:outline-none focus:shadow-outline-blue"
                                >
                                    Register
                                </button>
                            </Form>
                        )}
                    </Formik>

                    <div className="mt-6 text-center">
                        <Link to="/auth/login" className="text-sm text-text-primary">
                            Already have an account? Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}